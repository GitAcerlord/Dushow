"use client";

import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, DollarSign, Users, ArrowRight, 
  Clock, CheckCircle2, Loader2, Search
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { cn } from "@/lib/utils";

const ClientDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: contracts } = await supabase
      .from('contracts')
      .select('*, pro:profiles!contracts_pro_id_fkey(full_name, avatar_url)')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });

    if (contracts) {
      const totalSpent = contracts.filter(c => c.status === 'PAID' || c.status === 'COMPLETED')
        .reduce((acc, curr) => acc + Number(curr.value), 0);
      
      setStats({
        totalSpent,
        activeEvents: contracts.filter(c => c.status === 'PAID').length,
        pendingProposals: contracts.filter(c => c.status === 'PENDING').length
      });
      setRecentEvents(contracts.slice(0, 5));
    }
    setLoading(false);
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Meu Painel</h1>
          <p className="text-slate-500">Gerencie suas contratações e eventos.</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 rounded-xl">
          <Link to="/client/discovery"><Search className="w-4 h-4 mr-2" /> Buscar Artistas</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl"><DollarSign className="w-6 h-6 text-blue-600" /></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Total Investido</p>
              <h3 className="text-2xl font-black text-slate-900">R$ {stats?.totalSpent.toLocaleString('pt-BR')}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl"><Calendar className="w-6 h-6 text-emerald-600" /></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Eventos Ativos</p>
              <h3 className="text-2xl font-black text-slate-900">{stats?.activeEvents}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl"><Clock className="w-6 h-6 text-amber-600" /></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Propostas Pendentes</p>
              <h3 className="text-2xl font-black text-slate-900">{stats?.pendingProposals}</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-black text-slate-900">Eventos Recentes</h3>
        <div className="grid gap-4">
          {recentEvents.map((event) => (
            <Card key={event.id} className="p-4 border-none shadow-sm bg-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden">
                  <img src={event.pro?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${event.pro?.full_name}`} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{event.event_name}</h4>
                  <p className="text-xs text-slate-500">{event.pro?.full_name} • {new Date(event.event_date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge className={cn(
                  "uppercase text-[10px] font-bold",
                  event.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                )}>
                  {event.status}
                </Badge>
                <Button variant="ghost" size="icon" asChild>
                  <Link to={`/pro/contracts/${event.id}`}><ArrowRight className="w-4 h-4" /></Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;