"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, ShieldAlert, MessageSquare, Loader2, Filter, AlertTriangle, Eye
} from "lucide-react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { supabase } from '@/integrations/supabase/client';

const AdminMessages = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(full_name, avatar_url),
        receiver:profiles!messages_receiver_id_fkey(full_name, avatar_url),
        contract:contracts(event_name)
      `)
      .order('created_at', { ascending: false });

    if (!error) setMessages(data || []);
    setLoading(false);
  };

  const filteredMessages = messages.filter(m => 
    m.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.sender?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Auditoria de Mensagens</h1>
          <p className="text-slate-500">Monitore a comunicação e tentativas de bypass na plataforma.</p>
        </div>
        <div className="flex gap-4">
          <Input 
            placeholder="Buscar por conteúdo ou usuário..." 
            className="max-w-xs bg-white rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2rem]">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Remetente</TableHead>
                <TableHead>Destinatário</TableHead>
                <TableHead>Contexto (Evento)</TableHead>
                <TableHead className="w-[40%]">Conteúdo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMessages.map((msg) => (
                <TableRow key={msg.id} className={msg.is_blocked ? "bg-red-50/30" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={msg.sender?.avatar_url} />
                        <AvatarFallback>{msg.sender?.full_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-bold">{msg.sender?.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={msg.receiver?.avatar_url} />
                        <AvatarFallback>{msg.receiver?.full_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-bold">{msg.receiver?.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {msg.contract?.event_name || "Chat Direto"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm text-slate-700">{msg.content}</p>
                      {msg.is_blocked && (
                        <div className="p-2 bg-red-100 rounded-lg border border-red-200">
                          <p className="text-[10px] font-black text-red-600 uppercase">Conteúdo Original Bloqueado:</p>
                          <p className="text-xs text-red-800 italic">{msg.original_content_hidden}</p>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {msg.is_blocked ? (
                      <Badge variant="destructive" className="gap-1">
                        <ShieldAlert className="w-3 h-3" /> Bloqueado
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500">Seguro</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-[10px] text-slate-400">
                    {new Date(msg.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default AdminMessages;