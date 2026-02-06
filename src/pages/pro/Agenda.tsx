"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, MapPin, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

const ProAgenda = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchEvents();
  }, [currentMonth]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // QUERY SSOT: Apenas status válidos para agenda
      const { data } = await supabase
        .from('contracts')
        .select('*, profiles!contracts_client_id_fkey(full_name)')
        .eq('pro_id', user.id)
        .in('status', ['ACCEPTED', 'SIGNED', 'COMPLETED'])
        .order('event_date', { ascending: true });

      setEvents(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-900">Minha Agenda</h1>
        <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm">
          <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}><ChevronLeft /></button>
          <span className="font-bold uppercase text-sm">{currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</span>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}><ChevronRight /></button>
        </div>
      </div>

      {loading ? <div className="flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div> : (
        <div className="space-y-4">
          {events.length === 0 ? (
            <Card className="p-12 text-center text-slate-400 font-medium border-dashed border-2">Nenhum show confirmado para este período.</Card>
          ) : (
            events.map((event) => (
              <Card key={event.id} className="p-6 border-none shadow-sm bg-white flex gap-6 items-center rounded-[2rem]">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex flex-col items-center justify-center text-white">
                  <span className="text-2xl font-black">{new Date(event.event_date).getDate()}</span>
                  <span className="text-[10px] uppercase font-bold">{new Date(event.event_date).toLocaleString('pt-BR', { month: 'short' })}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900">{event.event_name}</h4>
                  <div className="flex gap-4 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.event_location}</span>
                  </div>
                </div>
                <Badge className={event.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}>
                  {event.status}
                </Badge>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProAgenda;