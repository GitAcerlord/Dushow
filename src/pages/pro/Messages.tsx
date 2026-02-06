"use client";

import React, { useState, useEffect } from 'react';
import ChatWindow from '@/components/chat/ChatWindow';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, MessageSquare, Calendar, Search, Filter } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const ProMessages = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // QUERY SIMÉTRICA: Busca contratos onde o usuário é o profissional
    // O contract_id serve como o conversation_id
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select(`
        id,
        event_name,
        status,
        value,
        event_date,
        client:profiles!contracts_client_id_fkey(id, full_name, avatar_url)
      `)
      .eq('pro_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("[ProMessages] Fetch error:", error);
    } else {
      setConversations(contracts || []);
      if (contracts && contracts.length > 0) setSelectedConv(contracts[0]);
    }
    setLoading(false);
  };

  const filteredConversations = conversations.filter(c => 
    c.client?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.event_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="p-4 md:p-8 h-[calc(100vh-64px)] flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-900">Mensagens</h1>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          Chat Seguro Ativo
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
        {/* Lista de Conversas */}
        <Card className="border-none shadow-xl bg-white overflow-hidden flex flex-col rounded-[2.5rem]">
          <div className="p-6 border-b space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input 
                placeholder="Buscar conversa..." 
                className="pl-10 bg-slate-50 border-none rounded-xl h-10 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredConversations.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-10" />
                <p className="text-sm font-medium">Nenhuma conversa encontrada.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div 
                  key={conv.id} 
                  onClick={() => setSelectedConv(conv)}
                  className={cn(
                    "p-5 flex items-center gap-4 cursor-pointer transition-all border-l-4 relative",
                    selectedConv?.id === conv.id 
                      ? 'bg-indigo-50 border-indigo-600' 
                      : 'border-transparent hover:bg-slate-50'
                  )}
                >
                  <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                    <AvatarImage src={conv.client?.avatar_url} />
                    <AvatarFallback>{conv.client?.full_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-black text-slate-900 truncate">{conv.client?.full_name}</h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{conv.status}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {conv.event_name}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Janela de Chat */}
        <div className="lg:col-span-2 h-full">
          {selectedConv ? (
            <ChatWindow 
              recipientId={selectedConv.client?.id}
              recipientName={selectedConv.client?.full_name} 
              recipientAvatar={selectedConv.client?.avatar_url}
              contractId={selectedConv.id}
            />
          ) : (
            <Card className="h-full flex flex-col items-center justify-center bg-slate-50 border-none rounded-[2.5rem] text-center p-10">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-6">
                <MessageSquare className="text-indigo-200 w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Selecione uma conversa</h3>
              <p className="text-slate-500 max-w-xs mx-auto mt-2">Escolha um contratante ao lado para iniciar ou continuar a negociação.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProMessages;