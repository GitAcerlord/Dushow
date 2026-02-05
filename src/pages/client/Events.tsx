"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, MapPin, FileText, Loader2, ArrowRight, Clock, CreditCard, MessageSquare
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { cn } from "@/lib/utils";

const ClientEvents = () => {
  const navigate = useNavigate();
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
      .select('*, pro:profiles!contracts_pro_id_fkey(id, full_name, avatar_url, price)')
      .eq('client_id', user.id)
      .order('event_date', { ascending: true });

    setEvents(data || []);
    setLoading(false);
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Meus Eventos</h1>
        <p className="text-slate-500">Acompanhe o status das suas contratações e negociações.</p>
      </div>

      <div className="grid gap-6">
        {events.length === 0 ? (
          <Card className="p-12 text-center space-y-4 border-dashed border-2 rounded-[2rem]">
            <Calendar className="w-12 h-12 text-slate-200 mx-auto" />
            <p className="text-slate-500 font-medium">Você ainda não tem solicitações de eventos.</p>
            <Button asChild className="bg-blue-600 rounded-xl">
              <Link to="/client/discovery">Explorar Artistas</Link>
            </Button>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id} className="p-6 border-none shadow-sm bg-white flex flex-col md:flex-row gap-6 items-center rounded-[2rem] hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex flex-col items-center justify-center text-blue-600 shrink-0">
                <span className="text-2xl font-black">{new Date(event.event_date).getDate()}</span>
                <span className="text-[10px] uppercase font-bold">{new Date(event.event_date).toLocaleString('pt-BR', { month: 'short' })}</span>
              </div>
              
              <div className="flex-1 space-y-2 w-full">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">{event.event_name}</h3>
                  <Badge className={cn(
                    "uppercase text-[10px] font-bold px-3 py-1 rounded-full",
                    event.status === 'PAID' ? 'bg-emerald-500 text-white' : 
                    event.status === 'ACCEPTED' ? 'bg-blue-500 text-white' :
                    event.status === 'PENDING' ? 'bg-amber-500 text-white' : 
                    event.status === 'CANCELLED' ? 'bg-slate-200 text-slate-500' : 'bg-slate-100 text-slate-500'
                  )}>
                    {event.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.event_location || 'Local a definir'}</span>
                  <span className="font-bold text-blue-600">Artista: {event.pro?.full_name}</span>
                  <span className="font-black text-slate-900">Valor: R$ {Number(event.value).toLocaleString('pt-BR')}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                {event.status === 'PENDING' && (
                  <Button asChild className="bg-amber-500 hover:bg-amber-600 rounded-xl gap-2 flex-1 md:flex-none">
                    <Link to={`/client/contracts/${event.id}`}><MessageSquare className="w-4 h-4" /> Revisar Proposta</Link>
                  </Button>
                )}
                
                {event.status === 'ACCEPTED' && (
                  <Button asChild className="bg-indigo-600 hover:bg-indigo-700 rounded-xl gap-2 flex-1 md:flex-none">
                    <Link to={`/client/checkout`} state={{ artist: event.pro, contractId: event.id }}><CreditCard className="w-4 h-4" /> Pagar Agora</Link>
                  </Button>
                )}

                <Button variant="outline" asChild className="rounded-xl gap-2 border-slate-200 text-slate-600 flex-1 md:flex-none">
                  <Link to={`/client/contracts/${event.id}`}><FileText className="w-4 h-4" /> Ver Contrato</Link>
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