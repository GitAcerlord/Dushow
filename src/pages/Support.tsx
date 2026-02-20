"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { showError, showSuccess } from "@/utils/toast";
import { Loader2, LifeBuoy, Send, Sparkles } from "lucide-react";

type Ticket = {
  id: string;
  subject: string;
  category?: string | null;
  priority?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type TicketMessage = {
  id: string;
  body: string;
  created_at?: string | null;
  is_admin_reply?: boolean | null;
};

const SupportPage = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [form, setForm] = useState({
    subject: "",
    category: "GENERAL",
    priority: "MEDIUM",
    body: "",
  });
  const [replyBody, setReplyBody] = useState("");

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) || null,
    [tickets, selectedTicketId],
  );

  const loadTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("id, subject, category, priority, status, created_at, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const list = (data as Ticket[]) || [];
      setTickets(list);
      if (!selectedTicketId && list.length > 0) setSelectedTicketId(list[0].id);
    } catch (error: any) {
      showError(error.message || "Erro ao carregar tickets de suporte.");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (ticketId: string) => {
    const { data, error } = await supabase
      .from("support_ticket_messages")
      .select("id, body, created_at, is_admin_reply")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    if (error) {
      showError(error.message || "Erro ao carregar mensagens do ticket.");
      return;
    }
    setMessages((data as TicketMessage[]) || []);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (selectedTicketId) loadMessages(selectedTicketId);
    else setMessages([]);
  }, [selectedTicketId]);

  const createTicket = async () => {
    if (!form.subject.trim() || !form.body.trim()) {
      showError("Preencha assunto e descricao do problema.");
      return;
    }

    setSubmitting(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) throw new Error("Usuario nao autenticado.");

      const { data: ticket, error: ticketError } = await supabase
        .from("support_tickets")
        .insert({
          requester_id: user.id,
          subject: form.subject.trim(),
          category: form.category,
          priority: form.priority,
          status: "OPEN",
          source_context: "APP",
        })
        .select("id")
        .single();
      if (ticketError || !ticket) throw ticketError || new Error("Falha ao criar ticket.");

      const { error: messageError } = await supabase.from("support_ticket_messages").insert({
        ticket_id: ticket.id,
        author_id: user.id,
        is_admin_reply: false,
        body: form.body.trim(),
      });
      if (messageError) throw messageError;

      const { data: admins } = await supabase.from("profiles").select("id").eq("role", "ADMIN");
      if ((admins || []).length > 0) {
        await supabase.from("notifications").insert(
          (admins || []).map((admin: any) => ({
            user_id: admin.id,
            title: "Novo ticket de suporte",
            content: `Um novo ticket foi aberto: "${form.subject.trim()}".`,
            type: "SUPPORT",
            link: "/admin/support",
            is_read: false,
            read_at: null,
          })),
        );
      }

      showSuccess("Ticket de suporte criado com sucesso.");
      setForm({ subject: "", category: "GENERAL", priority: "MEDIUM", body: "" });
      await loadTickets();
      setSelectedTicketId(ticket.id);
    } catch (error: any) {
      showError(error.message || "Falha ao criar ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const sendReply = async () => {
    if (!selectedTicketId || !replyBody.trim()) return;
    setSending(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) throw new Error("Usuario nao autenticado.");

      const { error } = await supabase.from("support_ticket_messages").insert({
        ticket_id: selectedTicketId,
        author_id: user.id,
        is_admin_reply: false,
        body: replyBody.trim(),
      });
      if (error) throw error;

      setReplyBody("");
      await loadMessages(selectedTicketId);
      await loadTickets();
    } catch (error: any) {
      showError(error.message || "Falha ao enviar mensagem.");
    } finally {
      setSending(false);
    }
  };

  const statusTone = (status?: string | null) => {
    const normalized = String(status || "OPEN").toUpperCase();
    if (["OPEN", "IN_PROGRESS"].includes(normalized)) return "bg-amber-100 text-amber-700 border-amber-200";
    if (["RESOLVED", "CLOSED"].includes(normalized)) return "bg-emerald-100 text-emerald-700 border-emerald-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const priorityTone = (priority?: string | null) => {
    const normalized = String(priority || "MEDIUM").toUpperCase();
    if (normalized === "URGENT") return "bg-red-100 text-red-700 border-red-200";
    if (normalized === "HIGH") return "bg-orange-100 text-orange-700 border-orange-200";
    if (normalized === "LOW") return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-indigo-100 text-indigo-700 border-indigo-200";
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="rounded-[2.5rem] bg-gradient-to-r from-[#2D1B69] via-[#1f2a6f] to-[#0f4d8a] p-8 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-amber-300" />
          <h1 className="text-3xl font-black">Central de Suporte</h1>
        </div>
        <p className="mt-2 text-white/80 max-w-3xl">
          Abra tickets para bugs, erros de contrato, pagamento e qualquer problema operacional. Nossa equipe acompanha todo o historico ate a resolucao.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="p-6 rounded-3xl border-none shadow-sm xl:col-span-1 bg-white/90 backdrop-blur">
          <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-indigo-600" /> Novo ticket
          </h3>
          <div className="space-y-3">
            <Input
              placeholder="Assunto do chamado"
              value={form.subject}
              onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
            />
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value.toUpperCase() }))}
            >
              <option value="GENERAL">Categoria: GERAL</option>
              <option value="CONTRACT">Categoria: CONTRATO</option>
              <option value="PAYMENT">Categoria: PAGAMENTO</option>
              <option value="MESSAGE">Categoria: MENSAGENS</option>
              <option value="BUG">Categoria: BUG</option>
            </select>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={form.priority}
              onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value.toUpperCase() }))}
            >
              <option value="LOW">Prioridade: BAIXA</option>
              <option value="MEDIUM">Prioridade: MEDIA</option>
              <option value="HIGH">Prioridade: ALTA</option>
              <option value="URGENT">Prioridade: URGENTE</option>
            </select>
            <Textarea
              placeholder="Descreva o problema com o maximo de detalhes (passos, tela, erro, impacto)."
              value={form.body}
              onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
              className="min-h-[140px]"
            />
            <Button onClick={createTicket} disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Abrir ticket"}
            </Button>
          </div>
        </Card>

        <Card className="p-0 rounded-3xl border-none shadow-sm xl:col-span-2 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 h-full">
            <div className="border-r">
              <div className="p-4 border-b font-black text-slate-900">Meus tickets</div>
              {loading ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">Nenhum ticket aberto.</div>
              ) : (
                <div className="max-h-[520px] overflow-y-auto">
                  {tickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      className={`w-full text-left px-4 py-3 border-b transition-colors hover:bg-slate-50 ${selectedTicketId === ticket.id ? "bg-indigo-50" : ""}`}
                      onClick={() => setSelectedTicketId(ticket.id)}
                    >
                      <p className="font-bold text-sm text-slate-900 truncate">{ticket.subject}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        <Badge className={`border ${statusTone(ticket.status)}`}>{ticket.status || "OPEN"}</Badge>
                        <Badge className={`border ${priorityTone(ticket.priority)}`}>{ticket.priority || "MEDIUM"}</Badge>
                        <span className="font-semibold">{ticket.category || "GENERAL"}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <div className="p-4 border-b">
                <p className="font-black text-slate-900 truncate">{selectedTicket?.subject || "Selecione um ticket"}</p>
                {selectedTicket && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge className={`border ${statusTone(selectedTicket.status)}`}>{selectedTicket.status || "OPEN"}</Badge>
                    <Badge className={`border ${priorityTone(selectedTicket.priority)}`}>{selectedTicket.priority || "MEDIUM"}</Badge>
                    <Badge variant="outline">{selectedTicket.category || "GENERAL"}</Badge>
                  </div>
                )}
              </div>

              <div className="flex-1 p-4 space-y-3 max-h-[420px] overflow-y-auto bg-slate-50/40">
                {messages.length === 0 ? (
                  <p className="text-sm text-slate-500">Sem mensagens ainda.</p>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className={`p-3 rounded-xl ${message.is_admin_reply ? "bg-blue-50 border border-blue-100" : "bg-white border"}`}>
                      <p className="text-xs font-black uppercase text-slate-500 mb-1">{message.is_admin_reply ? "Resposta do admin" : "Sua mensagem"}</p>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap">{message.body}</p>
                      <p className="text-[10px] text-slate-400 mt-2">{message.created_at ? new Date(message.created_at).toLocaleString("pt-BR") : "-"}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t flex gap-2">
                <Input
                  placeholder="Escreva uma atualizacao para este ticket..."
                  value={replyBody}
                  onChange={(event) => setReplyBody(event.target.value)}
                  disabled={!selectedTicketId}
                />
                <Button onClick={sendReply} disabled={!selectedTicketId || sending} className="bg-indigo-600 hover:bg-indigo-700">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SupportPage;
