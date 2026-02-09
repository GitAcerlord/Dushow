"use client";

import React, { useState, useEffect } from 'react';
import ChatWindow from '@/components/chat/ChatWindow';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, MessageSquare, Calendar } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { cn } from "@/lib/utils";

const ClientMessages = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Filtro: Mostra negociações em andamento, aceitas, assinadas ou recém-pagas.
    // Removemos apenas o que foi concluído (COMPLETED), rejeitado (REJECTED) ou cancelado.
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select(`
        id,
        event_name,
        status,
        pro:profiles!contracts_pro_id_fkey(id, full_name, avatar_url)
      `)
      .eq('client_id', user.id)
      .in('status', ['PENDING', 'ACCEPTED', 'SIGNED', 'PAID', 'CREATED'])
      .order('updated_at', { ascending: false });

    if (error) {
      console.error("Erro ao carregar conversas:", error);
    } else {
      setConversations(contracts || []);
      if (contracts && contracts.length > 0) setSelectedConv(contracts[0]);
    }
    setLoading(false);
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-120px)]">
      <Card className="border-none shadow-sm bg-white overflow-hidden flex flex-col rounded-[2rem]">
        <div className="p-6 border-b bg-slate-50">
          <h3 className="font-black text-slate-900">Conversas Ativas</h3>
          <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Negociações e Contratos Ativos</p>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-xs">Nenhuma negociação ativa no momento.</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div 
                key={conv.id} 
                onClick={() => setSelectedConv(conv)}
                className={cn(
                  "p-4 flex items-center gap-3 cursor-pointer transition-all border-l-4",
                  selectedConv?.id === conv.id ? 'bg-blue-50 border-blue-600' : 'border-transparent hover:bg-slate-50'
                )}
              >
                <Avatar>
                  <AvatarImage src={conv.pro?.avatar_url} />
                  <AvatarFallback>{conv.pro?.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{conv.pro?.full_name}</h4>
                    <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 uppercase">{conv.status}</Badge>
                  </div>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
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
            recipientId={selectedConv.pro?.id}
            recipientName={selectedConv.pro?.full_name} 
            recipientAvatar={selectedConv.pro?.avatar_url}
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

export default ClientMessages;