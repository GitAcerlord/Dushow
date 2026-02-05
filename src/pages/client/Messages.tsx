"use client";

import React, { useState, useEffect } from 'react';
import ChatWindow from '@/components/chat/ChatWindow';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, MessageSquare } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

const ClientMessages = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Busca artistas com quem o cliente tem contratos
    const { data: contracts } = await supabase
      .from('contracts')
      .select('pro:profiles!contracts_pro_id_fkey(id, full_name, avatar_url)')
      .eq('client_id', user.id);

    // Remove duplicatas
    const uniquePros = Array.from(new Set(contracts?.map(c => c.pro.id)))
      .map(id => contracts?.find(c => c.pro.id === id)?.pro);

    setContacts(uniquePros || []);
    if (uniquePros.length > 0) setSelectedContact(uniquePros[0]);
    setLoading(false);
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-120px)]">
      <Card className="border-none shadow-sm bg-white overflow-hidden flex flex-col rounded-[2rem]">
        <div className="p-6 border-b bg-slate-50">
          <h3 className="font-black text-slate-900">Meus Artistas</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-xs">Nenhuma conversa iniciada.</p>
            </div>
          ) : (
            contacts.map((contact) => (
              <div 
                key={contact.id} 
                onClick={() => setSelectedContact(contact)}
                className={cn(
                  "p-4 flex items-center gap-3 cursor-pointer transition-all border-l-4",
                  selectedContact?.id === contact.id ? 'bg-blue-50 border-blue-600' : 'border-transparent hover:bg-slate-50'
                )}
              >
                <Avatar>
                  <AvatarImage src={contact.avatar_url} />
                  <AvatarFallback>{contact.full_name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{contact.full_name}</h4>
                  <p className="text-[10px] text-slate-400">Clique para conversar</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <div className="lg:col-span-2">
        {selectedContact ? (
          <ChatWindow 
            recipientId={selectedContact.id}
            recipientName={selectedContact.full_name} 
            recipientAvatar={selectedContact.avatar_url}
            role="CLIENT"
          />
        ) : (
          <Card className="h-full flex items-center justify-center bg-slate-50 border-none rounded-[2rem]">
            <p className="text-slate-400">Selecione um artista para conversar.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ClientMessages;