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
  AlertCircle,
  RefreshCw,
  CalendarRange,
  User
} from "lucide-react";
import { showSuccess, showLoading, dismissToast } from "@/utils/toast";

const MOCK_EVENTS = [
  {
    id: 1,
    title: "Sunset Party - Clube Privilège",
    date: "25 de Maio, 2024",
    time: "18:00 - 22:00",
    location: "Búzios, RJ",
    status: "CONFIRMADO",
    client: "Clube Privilège",
    type: "Show",
    value: "R$ 15.000,00"
  },
  {
    id: 2,
    title: "Casamento VIP - Família Silva",
    date: "02 de Junho, 2024",
    time: "21:00 - 01:00",
    location: "São Paulo, SP",
    status: "PENDENTE",
    client: "Ricardo Silva",
    type: "Evento Privado",
    value: "R$ 4.500,00"
  },
  {
    id: 3,
    title: "Folga / Bloqueado",
    date: "10 de Junho, 2024",
    time: "Dia Inteiro",
    location: "-",
    status: "BLOQUEADO",
    client: "-",
    type: "Pessoal",
    value: "-"
  }
];

const ProAgenda = () => {
  const [currentMonth, setCurrentMonth] = useState("Maio 2024");

  const handleSync = () => {
    const toastId = showLoading("Sincronizando com Google Calendar...");
    setTimeout(() => {
      dismissToast(toastId);
      showSuccess("Agenda sincronizada com sucesso!");
    }, 1500);
  };

  const handleBlockDate = () => {
    showSuccess("Data bloqueada! Você não aparecerá nas buscas para este dia.");
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Agenda Inteligente</h1>
          <p className="text-slate-500 mt-1">Gerencie sua disponibilidade e evite conflitos de datas.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSync} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Sincronizar
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
            <Plus className="w-4 h-4 mr-2" />
            Novo Evento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Section */}
        <div className="space-y-6">
          <Card className="p-6 border-none shadow-sm bg-white">
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
                const isToday = day === 15;
                const hasEvent = [25, 2, 10].includes(day);
                return (
                  <button 
                    key={i} 
                    onClick={handleBlockDate}
                    className={`h-10 rounded-xl text-sm font-medium transition-all relative group
                      ${isToday ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-50 text-slate-600'}
                      ${hasEvent ? 'ring-2 ring-indigo-100' : ''}
                    `}
                  >
                    {day}
                    {hasEvent && (
                      <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-400 rounded-full"></span>
                    )}
                    <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity"></div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  Confirmado
                </div>
                <span className="font-bold text-slate-900">12</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  Pendente
                </div>
                <span className="font-bold text-slate-900">04</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                  Bloqueado
                </div>
                <span className="font-bold text-slate-900">02</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-sm bg-indigo-50 border border-indigo-100">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-indigo-900">Dica de Agenda</h4>
                <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
                  Mantenha sua agenda sempre atualizada para ganhar o selo de <strong>"Resposta Rápida"</strong> e subir no ranking.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Events List Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-slate-900">Próximos Compromissos</h3>
            <Button variant="ghost" size="sm" className="text-indigo-600 font-bold">Ver Todos</Button>
          </div>
          
          {MOCK_EVENTS.map((event) => (
            <Card key={event.id} className="p-5 border-none shadow-sm bg-white hover:shadow-md transition-all group">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white font-bold shrink-0
                    ${event.status === 'CONFIRMADO' ? 'bg-emerald-500 shadow-lg shadow-emerald-100' : 
                      event.status === 'PENDENTE' ? 'bg-amber-500 shadow-lg shadow-amber-100' : 'bg-slate-400'}
                  `}>
                    <span className="text-[10px] uppercase leading-none mb-1">{event.date.split(' ')[2]}</span>
                    <span className="text-xl leading-none">{event.date.split(' ')[0]}</span>
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{event.title}</h4>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        {event.time}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                        {event.location}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <User className="w-3.5 h-3.5 text-indigo-500" />
                        {event.client}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:flex-col md:items-end md:justify-center gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                  <div className="text-left md:text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cachê</p>
                    <p className="text-sm font-black text-slate-900">{event.value}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                    ${event.status === 'CONFIRMADO' ? 'bg-emerald-50 text-emerald-600' : 
                      event.status === 'PENDENTE' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}
                  `}>
                    {event.status === 'CONFIRMADO' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {event.status}
                  </div>
                </div>
              </div>
            </Card>
          ))}

          <button className="w-full py-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
              <CalendarRange className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold">Visualizar Agenda Completa</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProAgenda;