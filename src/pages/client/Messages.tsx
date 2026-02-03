"use client";

import React from 'react';
import ChatWindow from '@/components/chat/ChatWindow';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ClientMessages = () => {
  return (
    <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-120px)]">
      {/* Sidebar: Conversations List */}
      <Card className="border-none shadow-sm bg-white overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-bold text-slate-900">Meus Artistas</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {[
            { name: "DJ Alok", lastMsg: "Essa data está livre na minha agenda...", time: "10:05", active: true },
            { name: "Banda Jazz In", lastMsg: "Pode me enviar o rider técnico?", time: "Ontem", active: false },
          ].map((chat, i) => (
            <div key={i} className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${chat.active ? 'bg-blue-50/50 border-l-4 border-blue-600' : ''}`}>
              <Avatar>
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.name}`} />
                <AvatarFallback>{chat.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{chat.name}</h4>
                  <span className="text-[10px] text-slate-400">{chat.time}</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{chat.lastMsg}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Main Chat Window */}
      <div className="lg:col-span-2">
        <ChatWindow 
          recipientName="DJ Alok" 
          recipientAvatar="https://api.dicebear.com/7.x/avataaars/svg?seed=Alok"
          role="CLIENT"
        />
      </div>
    </div>
  );
};

export default ClientMessages;