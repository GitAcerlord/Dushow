"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { showError, showSuccess } from "@/utils/toast";
import { Loader2, Send } from "lucide-react";

type Ticket = {
  id: string;
  requester_id: string;
  subject: string;
  category?: string | null;
  priority?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  requester?: { full_name?: string | null } | null;
};

type TicketMessage = {
  id: string;
  body: string;
  created_at?: string | null;
  is_admin_reply?: boolean | null;
};

const AdminSupport = () => {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [search, setSearch] = useState("");
  const [reply, setReply] = useState("");
  const [newStatus, setNewStatus] = useState("IN_PROGRESS");

  const selected = useMemo(() => tickets.find((ticket) => ticket.id === selectedId) || null, [tickets, selectedId]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("id, requester_id, subject, category, priority, status, created_at, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;

      const rows = (data as Ticket[]) || [];
      const requesterIds = Array.from(new Set(rows.map((row) => row.requester_id)));
      const { data: requesters } = requesterIds.length > 0
        ? await supabase.from("profiles").select("id, full_name").in("id", requesterIds)
        : { data: [] as any[] };
      const requesterMap = new Map((requesters || []).map((row: any) => [row.id, row.full_name || "-"]));

      const normalized = rows.map((row) => ({
        ...row,
        requester: { full_name: requesterMap.get(row.requester_id) || "-" },
      }));

      setTickets(normalized);
      if (!selectedId && normalized.length > 0) setSelectedId(normalized[0].id);
    } catch (error: any) {
      showError(error.message || "Erro ao carregar tickets.");
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
      showError(error.message || "Erro ao carregar mensagens.");
      return;
    }
    setMessages((data as TicketMessage[]) || []);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (selectedId) loadMessages(selectedId);
    else setMessages([]);
  }, [selectedId]);

  const sendAdminReply = async () => {
    if (!selectedId || !reply.trim()) return;
    setSending(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) throw new Error("Usuario nao autenticado.");

      const { error } = await supabase.from("support_ticket_messages").insert({
        ticket_id: selectedId,
        author_id: user.id,
        is_admin_reply: true,
        body: reply.trim(),
      });
      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: selected?.requester_id,
        title: "Resposta do suporte",
        content: `Seu ticket "${selected?.subject || ""}" recebeu resposta do admin.`,
        type: "SUPPORT",
        link: "/app/support",
        is_read: false,
        read_at: null,
      });

      setReply("");
      await loadMessages(selectedId);
      await loadTickets();
      showSuccess("Resposta enviada ao usuario.");
    } catch (error: any) {
      showError(error.message || "Falha ao responder ticket.");
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async () => {
    if (!selectedId) return;
    setUpdating(true);
    try {
      const payload: Record<string, unknown> = { status: newStatus };
      if (newStatus === "RESOLVED" || newStatus === "CLOSED") {
        payload.closed_at = new Date().toISOString();
      }
      const { error } = await supabase.from("support_tickets").update(payload).eq("id", selectedId);
      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: selected?.requester_id,
        title: "Atualizacao de ticket",
        content: `Seu ticket "${selected?.subject || ""}" mudou para ${newStatus}.`,
        type: "SUPPORT",
        link: "/app/support",
        is_read: false,
        read_at: null,
      });

      await loadTickets();
      showSuccess("Status do ticket atualizado.");
    } catch (error: any) {
      showError(error.message || "Falha ao atualizar status.");
    } finally {
      setUpdating(false);
    }
  };

  const filtered = tickets.filter((ticket) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      ticket.subject.toLowerCase().includes(term) ||
      String(ticket.requester?.full_name || "").toLowerCase().includes(term) ||
      String(ticket.status || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-900">Suporte e Tickets</h1>
        <Input
          placeholder="Buscar ticket por assunto, usuario ou status"
          className="max-w-sm"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <Card className="p-0 rounded-3xl border-none shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[620px]">
          <div className="border-r">
            <div className="p-4 border-b font-black">Fila de tickets</div>
            {loading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">Nenhum ticket encontrado.</div>
            ) : (
              <div className="max-h-[560px] overflow-y-auto">
                {filtered.map((ticket) => (
                  <button
                    key={ticket.id}
                    className={`w-full text-left p-4 border-b hover:bg-slate-50 ${selectedId === ticket.id ? "bg-indigo-50" : ""}`}
                    onClick={() => {
                      setSelectedId(ticket.id);
                      setNewStatus(ticket.status || "IN_PROGRESS");
                    }}
                  >
                    <p className="font-bold text-sm truncate">{ticket.subject}</p>
                    <p className="text-xs text-slate-500 mt-1">{ticket.requester?.full_name || "-"}</p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="outline">{ticket.status || "OPEN"}</Badge>
                      <Badge variant="outline">{ticket.priority || "MEDIUM"}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="p-4 border-b">
              <p className="font-black text-slate-900 truncate">{selected?.subject || "Selecione um ticket"}</p>
              {selected && <p className="text-xs text-slate-500 mt-1">Solicitante: {selected.requester?.full_name || "-"}</p>}
              {selected && (
                <div className="flex gap-2 mt-3">
                  <Input value={newStatus} onChange={(event) => setNewStatus(event.target.value.toUpperCase())} className="max-w-[220px]" />
                  <Button onClick={updateStatus} disabled={updating} className="bg-indigo-600 hover:bg-indigo-700">
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Atualizar status"}
                  </Button>
                </div>
              )}
            </div>

            <div className="flex-1 p-4 space-y-3 max-h-[430px] overflow-y-auto bg-slate-50/40">
              {messages.length === 0 ? (
                <p className="text-sm text-slate-500">Sem mensagens neste ticket.</p>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`p-3 rounded-xl ${message.is_admin_reply ? "bg-indigo-50 border border-indigo-100" : "bg-white border"}`}>
                    <p className="text-xs font-black uppercase text-slate-500 mb-1">{message.is_admin_reply ? "Admin" : "Usuario"}</p>
                    <p className="text-sm text-slate-800 whitespace-pre-wrap">{message.body}</p>
                    <p className="text-[10px] text-slate-400 mt-2">{message.created_at ? new Date(message.created_at).toLocaleString("pt-BR") : "-"}</p>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t flex gap-2">
              <Textarea
                placeholder="Responder ticket..."
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                className="min-h-[88px]"
                disabled={!selectedId}
              />
              <Button onClick={sendAdminReply} disabled={!selectedId || sending} className="bg-indigo-600 hover:bg-indigo-700 self-end">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminSupport;
