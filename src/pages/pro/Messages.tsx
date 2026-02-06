"use client";

import React, { useState, useEffect } from 'react';
import ChatWindow from '@/components/chat/ChatWindow';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, MessageSquare, Calendar } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { cn } from "@/lib/utils";

const ProMessages = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Busca contratos onde o artista participa para listar os clientes
    const { data: contracts } = await supabase
      .from('contracts')
      .select(`
        id,
        event_name,
        status,
        client:profiles!contracts_client_id_fkey(id, full_name, avatar_url)
      `)
      .eq('pro_id', user.id)
      .order('created_at', { ascending: false });

    setConversations(contracts || []);
    if (contracts && contracts.length > 0) setSelectedConv(contracts[0]);
    setLoading(false);
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-120px)]">
      <Card className="border-none shadow-sm bg-white overflow-hidden flex flex-col rounded-[2rem]">
        <div className="p-6 border-b bg-slate-50">
          <h3 className="font-black text-slate-900">Conversas por Evento</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-xs">Nenhum contrato ou conversa ativa.</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div 
                key={conv.id} 
                onClick={() => setSelectedConv(conv)}
                className={cn(
                  "p-4 flex items-center gap-3 cursor-pointer transition-all border-l-4",
                  selectedConv?.id === conv.id ? 'bg-indigo-50 border-indigo-600' : 'border-transparent hover:bg-slate-50'
                )}
              >
                <Avatar>
                  <AvatarImage src={conv.client?.avatar_url} />
                  <AvatarFallback>{conv.client?.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{conv.client?.full_name}</h4>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {conv.event_name}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <div className="lg:col-span-2">
        {selectedConv ? (
          <ChatWindow 
            recipientId={selectedConv.client?.id}
            recipientName={selectedConv.client?.full_name} 
            recipientAvatar={selectedConv.client?.avatar_url}
            contractId={selectedConv.id}
          />
        ) : (
          <Card className="h-full flex items-center justify-center bg-slate-50 border-none rounded-[2rem]">
            <p className="text-slate-400">Selecione uma conversa para iniciar.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProMessages;