"use client";

import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { showSuccess } from "@/utils/toast";

const MOCK_EVENTS = [
  {
    id: 1,
    title: "Sunset Party - Clube Privilège",
    date: "25 de Maio, 2024",
    time: "18:00 - 22:00",
    location: "Búzios, RJ",
    status: "CONFIRMADO",
    client: "Clube Privilège",
    type: "Show"
  },
  {
    id: 2,
    title: "Casamento VIP - Família Silva",
    date: "02 de Junho, 2024",
    time: "21:00 - 01:00",
    location: "São Paulo, SP",
    status: "PENDENTE",
    client: "Ricardo Silva",
    type: "Evento Privado"
  },
  {
    id: 3,
    title: "Folga / Bloqueado",
    date: "10 de Junho, 2024",
    time: "Dia Inteiro",
    location: "-",
    status: "BLOQUEADO",
    client: "-",
    type: "Pessoal"
  }
];

const ProAgenda = () => {
  const [currentMonth, setCurrentMonth] = useState("Maio 2024");

  const handleBlockDate = () => {
    showSuccess("Data bloqueada com sucesso na sua agenda pública.");
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Minha Agenda</h1>
          <p className="text-slate-500 mt-1">Gerencie seus compromissos e evite conflitos de datas.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBlockDate}>
            Bloquear Data
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo Evento Manual
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Preview (Simplified) */}
        <Card className="p-6 border-none shadow-sm bg-white h-fit">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">{currentMonth}</h3>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-2 text-center mb-4">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(day => (
              <span key={day} className="text-[10px] font-bold text-slate-400 uppercase">{day}</span>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 31 }).map((_, i) => {
              const day = i + 1;
              const hasEvent = [25, 2, 10].includes(day);
              return (
                <button 
                  key={i} 
                  className={`h-10 rounded-lg text-sm font-medium transition-colors relative
                    ${day === 15 ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}
                    ${hasEvent ? 'ring-2 ring-indigo-100' : ''}
                  `}
                >
                  {day}
                  {hasEvent && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-400 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              Confirmado
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              Pendente
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="w-2 h-2 rounded-full bg-slate-400"></div>
              Bloqueado
            </div>
          </div>
        </Card>

        {/* Events List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Próximos Compromissos</h3>
          
          {MOCK_EVENTS.map((event) => (
            <Card key={event.id} className="p-5 border-none shadow-sm bg-white hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white font-bold
                    ${event.status === 'CONFIRMADO' ? 'bg-emerald-500' : 
                      event.status === 'PENDENTE' ? 'bg-amber-500' : 'bg-slate-400'}
                  `}>
                    <span className="text-[10px] uppercase leading-none">{event.date.split(' ')[2]}</span>
                    <span className="text-lg leading-none">{event.date.split(' ')[0]}</span>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-slate-900">{event.title}</h4>
                    <div className="flex flex-wrap gap-4 mt-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        {event.time}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5" />
                        {event.location}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Badge variant="outline" className="text-[10px] py-0 h-5">
                          {event.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden md:block">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                    <div className={`flex items-center gap-1 text-xs font-bold mt-0.5
                      ${event.status === 'CONFIRMADO' ? 'text-emerald-600' : 
                        event.status === 'PENDENTE' ? 'text-amber-600' : 'text-slate-500'}
                    `}>
                      {event.status === 'CONFIRMADO' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {event.status}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-slate-400">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          <Button variant="ghost" className="w-full text-slate-500 hover:text-indigo-600 py-8 border-2 border-dashed border-slate-200 rounded-2xl">
            <Plus className="w-5 h-5 mr-2" />
            Ver agenda completa
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProAgenda;