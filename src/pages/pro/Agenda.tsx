"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, MapPin, Loader2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

const ProAgenda = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgenda = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // BUSCA DERIVADA: Contratos que geram compromisso na agenda
      const { data } = await supabase
        .from('contracts')
        .select('*')
        .or(`contratante_profile_id.eq.${user.id},profissional_profile_id.eq.${user.id}`)
        .in('status', ['ASSINADO', 'PAGO', 'COMPLETED'])
        .order('data_evento', { ascending: true });

      setEvents(data || []);
      setLoading(false);
    };
    fetchAgenda();
  }, []);

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-black text-slate-900">Minha Agenda Automática</h1>
      <p className="text-slate-500 -mt-6">Eventos confirmados via contrato digital.</p>

      <div className="space-y-4">
        {events.length === 0 ? (
          <Card className="p-12 text-center text-slate-400 border-dashed border-2">Nenhum compromisso assinado.</Card>
        ) : (
          events.map((event) => (
            <Card key={event.id} className="p-6 border-none shadow-sm bg-white flex gap-6 items-center rounded-[2rem]">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex flex-col items-center justify-center text-white">
                <span className="text-2xl font-black">{new Date(event.data_evento).getDate()}</span>
                <span className="text-[10px] uppercase font-bold">{new Date(event.data_evento).toLocaleString('pt-BR', { month: 'short' })}</span>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900">{event.event_name}</h4>
                <div className="flex gap-4 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(event.data_evento).toLocaleTimeString()}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.event_location}</span>
                </div>
              </div>
              <Badge className="bg-emerald-500 text-white">{event.status}</Badge>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ProAgenda;