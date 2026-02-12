"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Send, ShieldAlert, Loader2
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showError } from "@/utils/toast";
import { getSafeImageUrl } from '@/utils/url-validator';

const ChatWindow = ({ recipientId, recipientName, recipientAvatar, contractId }: any) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user && contractId) {
        fetchMessages();
        
        const channel = supabase
          .channel(`chat:${contractId}`)
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `contract_id=eq.${contractId}`
          }, (payload) => {
            setMessages(prev => {
              const exists = prev.some(m => m.id === payload.new.id);
              return exists ? prev : [...prev, payload.new];
            });
          })
          .subscribe();

        return () => { supabase.removeChannel(channel); };
      }
    };
    initChat();
  }, [contractId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('contract_id', contractId)
      .order('created_at', { ascending: true });
    
    if (!error) setMessages(data || []);
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Regra de Negócio: Bloquear digitação de números no frontend
    const cleanValue = e.target.value.replace(/[0-9]/g, '');
    setInputText(cleanValue);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !currentUser || sending) return;

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('secure-messaging', {
        body: {
          senderId: currentUser.id,
          receiverId: recipientId,
          contractId: contractId,
          content: inputText
        }
      });

      if (error) {
        const errBody = await error.context?.json();
        throw new Error(errBody?.error || "Erro ao enviar mensagem.");
      }
      
      setMessages(prev => [...prev, data]);
      setInputText("");
    } catch (error: any) {
      showError(error.message);
    } finally {
      setSending(false);
    }
  };

  const safeAvatar = getSafeImageUrl(recipientAvatar, `https://api.dicebear.com/7.x/avataaars/svg?seed=${recipientName}`);

  return (
    <Card className="flex flex-col h-[600px] border-none shadow-xl bg-white overflow-hidden rounded-[2rem]">
      <div className="p-4 border-b flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={safeAvatar} />
            <AvatarFallback>{recipientName?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">{recipientName}</h4>
            <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              Chat Seguro Ativo
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 p-2 px-4 flex items-center gap-2 border-b border-amber-100">
        <ShieldAlert className="w-4 h-4 text-amber-600" />
        <p className="text-[10px] text-amber-800 font-medium">
          Números de telefone e e-mails são bloqueados automaticamente por segurança.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-600" /></div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                msg.sender_id === currentUser?.id 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
              }`}>
                {msg.content}
                <div className={`text-[10px] mt-1 text-right ${msg.sender_id === currentUser?.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-white border-t flex gap-2">
        <Input 
          placeholder="Digite sua mensagem (números não permitidos)..." 
          className="flex-1 bg-slate-50 border-none rounded-xl"
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <Button onClick={handleSendMessage} disabled={sending} className="bg-indigo-600 rounded-xl">
          {sending ? <Loader2 className="animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </Card>
  );
};

export default ChatWindow;