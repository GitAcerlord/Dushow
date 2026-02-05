"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, MapPin, FileText, Loader2, ArrowRight, Clock, CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { cn } from "@/lib/utils";

const ClientEvents = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('contracts')
      .select('*, pro:profiles!contracts_pro_id_fkey(full_name, avatar_url)')
      .eq('client_id', user.id)
      .order('event_date', { ascending: true });

    setEvents(data || []);
    setLoading(false);
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Meus Eventos</h1>
        <p className="text-slate-500">Acompanhe o status das suas contratações.</p>
      </div>

      <div className="grid gap-6">
        {events.length === 0 ? (
          <Card className="p-12 text-center space-y-4 border-dashed border-2">
            <Calendar className="w-12 h-12 text-slate-200 mx-auto" />
            <p className="text-slate-500 font-medium">Você ainda não contratou nenhum artista.</p>
            <Button asChild className="bg-blue-600">
              <Link to="/client/discovery">Explorar Artistas</Link>
            </Button>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id} className="p-6 border-none shadow-sm bg-white flex flex-col md:flex-row gap-6 items-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex flex-col items-center justify-center text-blue-600 shrink-0">
                <span className="text-2xl font-black">{new Date(event.event_date).getDate()}</span>
                <span className="text-[10px] uppercase font-bold">{new Date(event.event_date).toLocaleString('pt-BR', { month: 'short' })}</span>
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">{event.event_name}</h3>
                  <Badge className={cn(
                    "uppercase text-[10px] font-bold",
                    event.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 
                    event.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                  )}>
                    {event.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.event_location || 'Local a definir'}</span>
                  <span className="font-bold text-blue-600">Artista: {event.pro?.full_name}</span>
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <Button variant="outline" asChild className="flex-1 md:flex-none rounded-xl gap-2 border-blue-100 text-blue-600">
                  <Link to={`/pro/contracts/${event.id}`}><FileText className="w-4 h-4" /> Ver Contrato</Link>
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ClientEvents;