"use client";

import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { 
  TrendingUp, Users, DollarSign, Briefcase,
  ArrowUpRight, Loader2, Activity
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: contracts } = await supabase.from('contracts').select('value, status');
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

    if (contracts) {
      const grossRevenue = contracts.filter(c => c.status === 'PAID' || c.status === 'RELEASED' || c.status === 'COMPLETED')
        .reduce((acc, curr) => acc + Number(curr.value), 0);
      
      setStats({
        grossRevenue,
        platformFee: grossRevenue * 0.15, // 15% de comissão média
        userCount,
        activeContracts: contracts.filter(c => c.status === 'PAID').length
      });
    }
    setLoading(false);
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Painel de Controle</h1>
        <p className="text-slate-500">Visão geral do ecossistema DUSHOW.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Receita Bruta" value={`R$ ${stats.grossRevenue.toLocaleString('pt-BR')}`} icon={DollarSign} color="indigo" />
        <StatCard title="Comissões (15%)" value={`R$ ${stats.platformFee.toLocaleString('pt-BR')}`} icon={TrendingUp} color="emerald" />
        <StatCard title="Total Usuários" value={stats.userCount} icon={Users} color="blue" />
        <StatCard title="Shows em Andamento" value={stats.activeContracts} icon={Activity} color="amber" />
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <Card className="p-6 border-none shadow-sm bg-white">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 bg-${color}-50 rounded-lg`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
    </div>
    <p className="text-xs font-bold text-slate-400 uppercase">{title}</p>
    <h3 className="text-2xl font-black text-slate-900 mt-1">{value}</h3>
  </Card>
);

export default AdminDashboard;