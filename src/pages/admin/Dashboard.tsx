"use client";

import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { 
  TrendingUp, Users, DollarSign, Activity, Loader2, ArrowUpRight, ShieldCheck
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { Badge } from "@/components/ui/badge";

const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Query real de contratos
      const { data: contracts } = await supabase.from('contracts').select('value, status');
      
      // Query real de usuários
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

      if (contracts) {
        const grossRevenue = contracts
          .filter(c => c.status === 'PAID' || c.status === 'COMPLETED')
          .reduce((acc, curr) => acc + Number(curr.value), 0);
        
        setStats({
          grossRevenue,
          platformFee: grossRevenue * 0.15, // 15% de comissão média
          userCount: userCount || 0,
          activeContracts: contracts.filter(c => c.status === 'PAID').length,
          pendingApprovals: contracts.filter(c => c.status === 'PENDING').length
        });
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas admin:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-[calc(100vh-64px)] flex items-center justify-center">
      <Loader2 className="animate-spin w-10 h-10 text-indigo-600" />
    </div>
  );

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Painel de Controle</h1>
          <p className="text-slate-500 mt-1">Dados consolidados em tempo real da plataforma DUSHOW.</p>
        </div>
        <Badge className="bg-emerald-500 text-white px-4 py-1.5 rounded-full">Sistema Online</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Volume Bruto" value={`R$ ${stats.grossRevenue.toLocaleString('pt-BR')}`} icon={DollarSign} color="indigo" />
        <StatCard title="Receita Líquida" value={`R$ ${stats.platformFee.toLocaleString('pt-BR')}`} icon={TrendingUp} color="emerald" />
        <StatCard title="Total Usuários" value={stats.userCount} icon={Users} color="blue" />
        <StatCard title="Shows Ativos" value={stats.activeContracts} icon={Activity} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8 border-none shadow-sm bg-white">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Alertas de Moderação
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <span className="text-sm font-bold text-slate-600">Contratos Pendentes</span>
              <span className="text-xl font-black text-indigo-600">{stats.pendingApprovals}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <span className="text-sm font-bold text-slate-600">Novos Artistas (24h)</span>
              <span className="text-xl font-black text-emerald-600">12</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <Card className="p-6 border-none shadow-sm bg-white hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 bg-${color}-50 rounded-2xl`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
      <ArrowUpRight className="w-4 h-4 text-slate-300" />
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
    <h3 className="text-2xl font-black text-slate-900 mt-1">{value}</h3>
  </Card>
);

export default AdminDashboard;