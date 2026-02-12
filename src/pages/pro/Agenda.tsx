"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Loader2, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

const ProAgenda = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('contracts')
        .select('*, profiles!contracts_client_id_fkey(full_name)')
        .eq('pro_id', user.id)
        .in('status', ['ACCEPTED', 'SIGNED', 'COMPLETED', 'PAID'])
        .order('event_date', { ascending: true });

      setEvents(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const eventsForDate = (day: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(e => {
      const eventDate = new Date(e.event_date);
      return eventDate.getDate() === day && 
             eventDate.getMonth() === currentDate.getMonth() &&
             eventDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const statusColors: any = {
    'COMPLETED': 'bg-emerald-500',
    'PAID': 'bg-blue-500',
    'ACCEPTED': 'bg-amber-500',
    'SIGNED': 'bg-purple-500'
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Minha Agenda</h1>
          <p className="text-sm text-slate-500 mt-1">Visualize todos os seus shows confirmados</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-md border border-slate-200">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition"><ChevronLeft className="w-5 h-5" /></button>
          <span className="font-bold uppercase text-sm min-w-[180px] text-center">{currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</span>
          <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-600 w-8 h-8" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* Calendário */}
          <Card className="p-6 border-none shadow-lg bg-white rounded-2xl">
            {/* Cabeçalho dias da semana */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(d => (
                <div key={d} className="text-center font-bold text-slate-500 text-xs py-3">{d}</div>
              ))}
            </div>

            {/* Dias vazios */}
            {emptyDays.map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Dias com conteúdo */}
            {days.map(day => {
              const dayEvents = eventsForDate(day);
              const hasEvents = dayEvents.length > 0;
              return (
                <div
                  key={day}
                  className={`aspect-square rounded-xl border-2 transition-all flex flex-col p-2 ${
                    hasEvents
                      ? 'border-indigo-300 bg-indigo-50'
                      : 'border-slate-200 bg-white hover:border-indigo-200'
                  }`}
                >
                  <span className="font-bold text-slate-900 mb-1">{day}</span>
                  
                  {/* Mostrar até 2 eventos por dia */}
                  <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
                    {dayEvents.slice(0, 2).map((event, idx) => (
                      <div
                        key={event.id}
                        className={`text-[10px] font-bold px-2 py-1 rounded text-white truncate ${statusColors[event.status] || 'bg-slate-500'}`}
                        title={event.event_name}
                      >
                        {event.event_name.substring(0, 12)}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-slate-500 px-2">+{dayEvents.length - 2} mais</div>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>

          {/* Lista de eventos */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Próximos Shows</h2>
            {events.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-2 bg-slate-50">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-slate-500 font-medium">Nenhum show confirmado</p>
              </Card>
            ) : (
              events.slice(0, 5).map(event => {
                const eventDate = new Date(event.event_date);
                return (
                  <Card key={event.id} className="p-4 border-none shadow-md bg-white rounded-xl hover:shadow-lg transition">
                    <div className="flex gap-4 items-start">
                      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg p-4 text-white min-w-fit">
                        <div className="text-2xl font-black">{eventDate.getDate()}</div>
                        <div className="text-xs font-bold uppercase">{eventDate.toLocaleString('pt-BR', { month: 'short' })}</div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900">{event.event_name}</h3>
                        <p className="text-sm text-slate-500 mt-1">{event.profiles?.full_name}</p>
                        <div className="flex gap-3 mt-3 text-xs text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {event.event_location}
                          </span>
                        </div>
                      </div>
                      <Badge className={`${statusColors[event.status] || 'bg-slate-500'} text-white`}>
                        {event.status}
                      </Badge>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProAgenda;