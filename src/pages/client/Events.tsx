"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Calendar, MapPin, FileText, Loader2, ArrowRight, Clock, CreditCard, MessageSquare, Filter, X, User
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { cn } from "@/lib/utils";

const ClientEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('contracts')
        .select('*, pro:profiles!contracts_pro_id_fkey(id, full_name, avatar_url, price)')
        .eq('client_id', user.id);

      if (startDate && startDate !== "") {
        query = query.gte('event_date', new Date(startDate).toISOString());
      }
      if (endDate && endDate !== "") {
        const end = new Date(endDate);
        end.setHours(23, 59, 59);
        query = query.lte('event_date', end.toISOString());
      }

      const { data, error } = await query.order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Fetch Events Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setTimeout(() => fetchEvents(), 10);
  };

  if (loading && events.length === 0) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Meus Eventos</h1>
          <p className="text-slate-500">Acompanhe o status das suas contratações e negociações.</p>
        </div>

        <Card className="p-4 border-none shadow-sm bg-white flex flex-wrap items-center gap-4 rounded-2xl w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-400 uppercase">Filtrar Data:</span>
          </div>
          <div className="flex items-center gap-2">
            <Input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 text-xs bg-slate-50 border-none rounded-lg w-32"
            />
            <span className="text-slate-300">até</span>
            <Input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 text-xs bg-slate-50 border-none rounded-lg w-32"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => fetchEvents()} size="sm" className="bg-blue-600 h-9 rounded-lg px-4 font-bold">Aplicar</Button>
            {(startDate || endDate) && (
              <Button onClick={clearFilters} variant="ghost" size="sm" className="h-9 rounded-lg text-slate-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
        ) : events.length === 0 ? (
          <Card className="p-20 text-center space-y-4 border-dashed border-2 rounded-[3rem] bg-slate-50/50">
            <Calendar className="w-16 h-16 text-slate-200 mx-auto" />
            <div className="space-y-1">
              <p className="text-slate-900 font-black text-xl">Nenhum evento encontrado</p>
              <p className="text-slate-500">Tente ajustar os filtros de data ou explore novos artistas.</p>
            </div>
            <Button asChild className="bg-blue-600 rounded-xl px-8 h-12 font-bold shadow-lg shadow-blue-100">
              <Link to="/client/discovery">Explorar Artistas</Link>
            </Button>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id} className="p-6 border-none shadow-sm bg-white flex flex-col md:flex-row gap-6 items-center rounded-[2.5rem] hover:shadow-md transition-all border border-transparent hover:border-blue-100">
              <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex flex-col items-center justify-center text-blue-600 shrink-0 border border-blue-100">
                <span className="text-3xl font-black leading-none">{new Date(event.event_date).getDate()}</span>
                <span className="text-[10px] uppercase font-black tracking-tighter">{new Date(event.event_date).toLocaleString('pt-BR', { month: 'short' })}</span>
              </div>
              
              <div className="flex-1 space-y-3 w-full">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-900">{event.event_name}</h3>
                  <Badge className={cn(
                    "uppercase text-[10px] font-black px-4 py-1.5 rounded-full border-none shadow-sm",
                    event.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 
                    event.status === 'ACCEPTED' ? 'bg-blue-500 text-white' :
                    event.status === 'SIGNED' ? 'bg-indigo-600 text-white' :
                    event.status === 'PENDING' ? 'bg-amber-500 text-white' : 
                    event.status === 'CANCELLED' ? 'bg-slate-200 text-slate-500' : 'bg-slate-100 text-slate-500'
                  )}>
                    {event.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-blue-400" /> {new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-blue-400" /> {event.event_location || 'Local a definir'}</span>
                  <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-blue-400" /> {event.pro?.full_name}</span>
                  <span className="font-black text-slate-900 bg-slate-50 px-2 py-0.5 rounded-lg">R$ {Number(event.value).toLocaleString('pt-BR')}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                {event.status === 'PENDING' && (
                  <Button asChild className="bg-amber-500 hover:bg-amber-600 rounded-xl gap-2 flex-1 md:flex-none font-bold">
                    <Link to={`/client/contracts/${event.id}`}><MessageSquare className="w-4 h-4" /> Revisar Proposta</Link>
                  </Button>
                )}
                
                {/* Habilitado pagamento para ACCEPTED ou SIGNED */}
                {(event.status === 'ACCEPTED' || event.status === 'SIGNED') && (
                  <Button asChild className="bg-indigo-600 hover:bg-indigo-700 rounded-xl gap-2 flex-1 md:flex-none font-black shadow-lg shadow-indigo-100">
                    <Link to={`/client/checkout`} state={{ artist: event.pro, contractId: event.id }}><CreditCard className="w-4 h-4" /> Pagar Agora</Link>
                  </Button>
                )}

                <Button variant="outline" asChild className="rounded-xl gap-2 border-slate-200 text-slate-600 flex-1 md:flex-none font-bold hover:bg-slate-50">
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