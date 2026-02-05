"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Send, ShieldAlert, Loader2, MoreVertical, FileText, CreditCard
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { scanMessageForBypass } from "@/utils/chat-filter";
import { showError } from "@/utils/toast";

const ChatWindow = ({ recipientId, recipientName, recipientAvatar, role }: any) => {
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
      if (user && recipientId) {
        fetchMessages(user.id);
        subscribeToMessages(user.id);
      }
    };
    initChat();
  }, [recipientId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async (userId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });
    
    setMessages(data || []);
    setLoading(false);
  };

  const subscribeToMessages = (userId: string) => {
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages' 
      }, (payload) => {
        const newMsg = payload.new;
        if ((newMsg.sender_id === userId && newMsg.receiver_id === recipientId) || 
            (newMsg.sender_id === recipientId && newMsg.receiver_id === userId)) {
          setMessages(prev => [...prev, newMsg]);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !currentUser || sending) return;

    const filter = scanMessageForBypass(inputText);
    if (!filter.isSafe) {
      showError(filter.reason || "Mensagem bloqueada.");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: currentUser.id,
        receiver_id: recipientId,
        content: inputText
      });
      if (error) throw error;
      setInputText("");
    } catch (error: any) {
      showError("Erro ao enviar mensagem.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="flex flex-col h-[600px] border-none shadow-xl bg-white overflow-hidden rounded-[2rem]">
      <div className="p-4 border-b flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={recipientAvatar} />
            <AvatarFallback>{recipientName?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">{recipientName}</h4>
            <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              Online
            </p>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 p-2 px-4 flex items-center gap-2 border-b border-amber-100">
        <ShieldAlert className="w-4 h-4 text-amber-600" />
        <p className="text-[10px] text-amber-800 font-medium">Negocie e pague apenas pela DUSHOW para sua segurança.</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
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
                <p className={`text-[10px] mt-1 text-right ${msg.sender_id === currentUser?.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-white border-t flex gap-2">
        <Input 
          placeholder="Digite sua mensagem..." 
          className="flex-1 bg-slate-50 border-none rounded-xl"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
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