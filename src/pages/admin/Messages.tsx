"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldAlert, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";

type AdminMessage = {
  id: string;
  content?: string | null;
  is_blocked?: boolean | null;
  original_content_hidden?: string | null;
  created_at?: string | null;
  sender?: { full_name?: string | null; avatar_url?: string | null } | null;
  receiver?: { full_name?: string | null; avatar_url?: string | null } | null;
  contract?: { event_name?: string | null } | null;
};

const AdminMessages = () => {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const rich = await supabase
        .from("messages")
        .select("id, content, created_at, is_blocked, original_content_hidden, sender_id, receiver_id, contract_id")
        .order("created_at", { ascending: false });

      let rows: any[] = [];
      if (!rich.error) {
        rows = rich.data || [];
      } else {
        const minimal = await supabase
          .from("messages")
          .select("id, content, created_at, sender_id, receiver_id, contract_id")
          .order("created_at", { ascending: false });
        if (!minimal.error) {
          rows = (minimal.data || []).map((item: any) => ({ ...item, is_blocked: false, original_content_hidden: null }));
        } else {
          const ultraMinimal = await supabase
            .from("messages")
            .select("id, content, created_at, sender_id, receiver_id")
            .order("created_at", { ascending: false });
          if (ultraMinimal.error) throw ultraMinimal.error;
          rows = (ultraMinimal.data || []).map((item: any) => ({
            ...item,
            contract_id: null,
            is_blocked: false,
            original_content_hidden: null,
          }));
        }
      }

      const profileIds = Array.from(
        new Set(
          rows.flatMap((row) => [row.sender_id, row.receiver_id].filter(Boolean)),
        ),
      ) as string[];
      const contractIds = Array.from(new Set(rows.map((row) => row.contract_id).filter(Boolean))) as string[];

      const [{ data: profiles }, { data: contracts }] = await Promise.all([
        profileIds.length ? supabase.from("profiles").select("id, full_name, avatar_url").in("id", profileIds) : Promise.resolve({ data: [] as any[] }),
        contractIds.length ? supabase.from("contracts").select("id, event_name").in("id", contractIds) : Promise.resolve({ data: [] as any[] }),
      ]);

      const profileMap = new Map((profiles || []).map((profile: any) => [profile.id, profile]));
      const contractMap = new Map((contracts || []).map((contract: any) => [contract.id, contract]));

      setMessages(
        rows.map((row) => ({
          id: row.id,
          content: row.content,
          is_blocked: row.is_blocked,
          original_content_hidden: row.original_content_hidden,
          created_at: row.created_at,
          sender: profileMap.get(row.sender_id) || null,
          receiver: profileMap.get(row.receiver_id) || null,
          contract: contractMap.get(row.contract_id) || null,
        })),
      );
    } catch (error: any) {
      showError(error.message || "Erro ao carregar mensagens.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const filteredMessages = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return messages;

    return messages.filter((message) => {
      const content = (message.content || "").toLowerCase();
      const sender = (message.sender?.full_name || "").toLowerCase();
      const receiver = (message.receiver?.full_name || "").toLowerCase();
      return content.includes(term) || sender.includes(term) || receiver.includes(term);
    });
  }, [messages, searchTerm]);

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Auditoria de Mensagens</h1>
          <p className="text-slate-500">Monitore comunicacao e tentativas de bypass na plataforma.</p>
        </div>
        <Input
          placeholder="Buscar por conteudo ou usuario..."
          className="max-w-xs bg-white rounded-xl"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2rem]">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="animate-spin text-indigo-600" />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Remetente</TableHead>
                <TableHead>Destinatario</TableHead>
                <TableHead>Contexto (Evento)</TableHead>
                <TableHead className="w-[40%]">Conteudo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMessages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                    Nenhuma mensagem encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMessages.map((message) => (
                  <TableRow key={message.id} className={message.is_blocked ? "bg-red-50/30" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={message.sender?.avatar_url || undefined} />
                          <AvatarFallback>{(message.sender?.full_name || "?").slice(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-bold">{message.sender?.full_name || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={message.receiver?.avatar_url || undefined} />
                          <AvatarFallback>{(message.receiver?.full_name || "?").slice(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-bold">{message.receiver?.full_name || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {message.contract?.event_name || "Chat Direto"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm text-slate-700">{message.content || "-"}</p>
                        {message.is_blocked && (
                          <div className="p-2 bg-red-100 rounded-lg border border-red-200">
                            <p className="text-[10px] font-black text-red-600 uppercase">Conteudo Original Bloqueado:</p>
                            <p className="text-xs text-red-800 italic">{message.original_content_hidden || "-"}</p>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {message.is_blocked ? (
                        <Badge variant="destructive" className="gap-1">
                          <ShieldAlert className="w-3 h-3" /> Bloqueado
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500">Seguro</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-[10px] text-slate-400">
                      {message.created_at ? new Date(message.created_at).toLocaleString() : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default AdminMessages;
