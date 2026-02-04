"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, MapPin, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from '@/lib/supabase';

const ProAgenda = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('contracts')
        .select('*, profiles!contracts_client_id_fkey(full_name)')
        .eq('pro_id', user.id)
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>;

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold text-slate-900">Minha Agenda Real</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {events.length === 0 ? (
            <Card className="p-12 text-center text-slate-500">Nenhum show agendado no momento.</Card>
          ) : (
            events.map((event) => (
              <Card key={event.id} className="p-5 border-none shadow-sm bg-white hover:shadow-md transition-all">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white font-bold shrink-0 ${event.status === 'PAID' ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                      <span className="text-xl">{new Date(event.event_date).getDate()}</span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900">{event.event_name}</h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(event.event_date).toLocaleTimeString()}</span>
                        <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {event.event_location}</span>
                        <span className="flex items-center gap-1.5 font-bold text-indigo-600">Contratante: {event.profiles?.full_name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">R$ {Number(event.value).toLocaleString('pt-BR')}</p>
                    <Badge className={event.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}>
                      {event.status}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProAgenda;