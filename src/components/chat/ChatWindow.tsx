"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Send, 
  ShieldAlert, 
  Info, 
  CreditCard, 
  FileText,
  MoreVertical,
  PhoneOff
} from "lucide-react";
import { scanMessageForBypass } from "@/utils/chat-filter";
import { showError, showSuccess } from "@/utils/toast";

interface Message {
  id: number;
  sender: 'me' | 'other';
  text: string;
  time: string;
}

const ChatWindow = ({ recipientName, recipientAvatar, role }: any) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: 'other', text: "Olá! Gostaria de saber sua disponibilidade para o dia 15/07.", time: "10:00" },
    { id: 2, sender: 'me', text: "Olá! Essa data está livre na minha agenda. Qual seria o tipo de evento?", time: "10:05" },
  ]);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const filter = scanMessageForBypass(inputText);
    
    if (!filter.isSafe) {
      showError(filter.reason || "Mensagem bloqueada por segurança.");
      return;
    }

    const newMessage: Message = {
      id: Date.now(),
      sender: 'me',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMessage]);
    setInputText("");
  };

  return (
    <Card className="flex flex-col h-[600px] border-none shadow-xl bg-white overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={recipientAvatar} />
            <AvatarFallback>{recipientName[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">{recipientName}</h4>
            <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-slate-400">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Safety Banner */}
      <div className="bg-amber-50 p-2 px-4 flex items-center gap-2 border-b border-amber-100">
        <ShieldAlert className="w-4 h-4 text-amber-600" />
        <p className="text-[10px] text-amber-800 font-medium">
          Para sua segurança, negocie e pague apenas pela DUSHOW. Mensagens com contatos externos são bloqueadas.
        </p>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
              msg.sender === 'me' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
            }`}>
              {msg.text}
              <p className={`text-[10px] mt-1 text-right ${msg.sender === 'me' ? 'text-indigo-200' : 'text-slate-400'}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="p-3 border-t bg-white flex gap-2">
        {role === 'PRO' ? (
          <Button variant="outline" size="sm" className="text-xs gap-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50">
            <FileText className="w-3.5 h-3.5" /> Enviar Proposta
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="text-xs gap-2 border-emerald-100 text-emerald-600 hover:bg-emerald-50">
            <CreditCard className="w-3.5 h-3.5" /> Pagar Cachê
          </Button>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t flex gap-2">
        <Input 
          placeholder="Digite sua mensagem..." 
          className="flex-1 bg-slate-50 border-none focus-visible:ring-indigo-500"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <Button 
          onClick={handleSendMessage}
          className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-4"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};

export default ChatWindow;