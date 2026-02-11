"use client";

import React, { useState, useEffect } from 'react';
import ChatWindow from '@/components/chat/ChatWindow';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, MessageSquare, Calendar, Search, ArrowLeft } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const ProMessages = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showList, setShowList] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: contracts } = await supabase
      .from('contracts')
      .select(`id, event_name, status, client:profiles!contracts_client_id_fkey(id, full_name, avatar_url)`)
      .eq('profissional_profile_id', user.id)
      .order('created_at', { ascending: false });

    setConversations(contracts || []);
    setLoading(false);
  };

  const handleSelect = (conv: any) => {
    setSelectedConv(conv);
    setShowList(false);
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-[#2D1B69]" /></div>;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-[#2D1B69]">Mensagens</h1>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* List Area */}
        <Card className={cn(
          "w-full lg:w-80 border-none shadow-xl bg-white overflow-hidden flex flex-col rounded-[2.5rem]",
          !showList && "hidden lg:flex"
        )}>
          <div className="p-6 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input 
                placeholder="Buscar..." 
                className="pl-10 bg-slate-50 border-none rounded-xl h-10 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
              <div 
                key={conv.id} 
                onClick={() => handleSelect(conv)}
                className={cn(
                  "p-5 flex items-center gap-4 cursor-pointer transition-all border-l-4",
                  selectedConv?.id === conv.id ? 'bg-indigo-50 border-[#2D1B69]' : 'border-transparent hover:bg-slate-50'
                )}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={conv.client?.avatar_url} />
                  <AvatarFallback>{conv.client?.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-[#2D1B69] truncate">{conv.client?.full_name}</h4>
                  <p className="text-[10px] text-slate-400 truncate">{conv.event_name}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Chat Area */}
        <div className={cn(
          "flex-1 h-full",
          showList && "hidden lg:block"
        )}>
          {selectedConv ? (
            <div className="h-full flex flex-col">
              <button onClick={() => setShowList(true)} className="lg:hidden flex items-center gap-2 text-[#2D1B69] font-black mb-4">
                <ArrowLeft size={20} /> Voltar para lista
              </button>
              <ChatWindow 
                recipientId={selectedConv.client?.id}
                recipientName={selectedConv.client?.full_name} 
                recipientAvatar={selectedConv.client?.avatar_url}
                contractId={selectedConv.id}
              />
            </div>
          ) : (
            <Card className="h-full flex flex-col items-center justify-center bg-slate-50 border-none rounded-[2.5rem] text-center p-10">
              <MessageSquare className="text-indigo-200 w-16 h-16 mb-4" />
              <h3 className="text-xl font-black text-[#2D1B69]">Selecione uma conversa</h3>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProMessages;