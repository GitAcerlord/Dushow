"use client";

import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, DollarSign, ArrowRight, 
  Clock, Loader2, Search, CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { cn } from "@/lib/utils";

const ClientDashboard = () => {
  const [stats, setStats] = useState({
    totalSpent: 0,
    activeEvents: 0,
    pendingProposals: 0
  });
  const [relevantEvents, setRelevantEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('*, pro:profiles!contracts_pro_id_fkey(full_name, avatar_url)')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Erro ao buscar dados do painel:", error);
    } else if (contracts) {
      const totalSpent = contracts
        .filter(c => c.status === 'PAID' || c.status === 'COMPLETED')
        .reduce((acc, curr) => acc + Number(curr.value), 0);
      
      const activeEvents = contracts.filter(c => c.status === 'SIGNED' || c.status === 'PAID').length;
      const pendingProposals = contracts.filter(c => c.status === 'PENDING').length;

      setStats({ totalSpent, activeEvents, pendingProposals });
      const filtered = contracts.filter(c => ['PENDING', 'SIGNED', 'ACCEPTED', 'PAID'].includes(c.status));
      setRelevantEvents(filtered.slice(0, 10));
    }
    setLoading(false);
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Meu Painel</h1>
          <p className="text-slate-500">Acompanhe seus eventos e contratações em tempo real.</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-100">
          <Link to="/app/discovery"><Search className="w-4 h-4 mr-2" /> Buscar Novos Artistas</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl"><DollarSign className="w-6 h-6 text-blue-600" /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Investido</p>
              <h3 className="text-2xl font-black text-slate-900">R$ {stats.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl"><CheckCircle2 className="w-6 h-6 text-emerald-600" /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Eventos Confirmados</p>
              <h3 className="text-2xl font-black text-slate-900">{stats.activeEvents}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl"><Clock className="w-6 h-6 text-amber-600" /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Propostas Pendentes</p>
              <h3 className="text-2xl font-black text-slate-900">{stats.pendingProposals}</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-black text-slate-900">Acompanhamento de Eventos</h3>
        <div className="grid gap-4">
          {relevantEvents.length === 0 ? (
            <Card className="p-12 text-center text-slate-400 border-dashed border-2">
              Nenhuma proposta ou evento ativo no momento.
            </Card>
          ) : (
            relevantEvents.map((event) => (
              <Card key={event.id} className="p-4 border-none shadow-sm bg-white flex items-center justify-between hover:shadow-md transition-shadow rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-50">
                    <img 
                      src={event.pro?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${event.pro?.full_name}`} 
                      className="w-full h-full object-cover" 
                      alt="Artista"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{event.event_name}</h4>
                    <p className="text-xs text-slate-500">{event.pro?.full_name} • {new Date(event.event_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Valor</p>
                    <p className="text-sm font-bold text-blue-600">R$ {Number(event.value).toLocaleString('pt-BR')}</p>
                  </div>
                  <Badge className={cn(
                    "uppercase text-[10px] font-black px-3 py-1 rounded-full",
                    event.status === 'PAID' || event.status === 'SIGNED' ? 'bg-emerald-50 text-emerald-600' : 
                    event.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'
                  )}>
                    {event.status}
                  </Badge>
                  <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-blue-50 hover:text-blue-600">
                    <Link to={`/app/contracts/${event.id}`}><ArrowRight className="w-4 h-4" /></Link>
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;