"use client";

import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, loading }: any) => (
  <Card className="p-6 border-none shadow-sm bg-white">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-slate-50 rounded-lg">
        <Icon className="w-6 h-6 text-indigo-600" />
      </div>
      {!loading && trend && (
        <div className={cn(
          "flex items-center text-xs font-medium px-2 py-1 rounded-full",
          trend === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
        )}>
          {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
          {trendValue}
        </div>
      )}
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-slate-300 mt-2" />
      ) : (
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
      )}
    </div>
  </Card>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // Simulação de busca no Supabase (ajustar conforme as tabelas reais)
      // const { data, error } = await supabase.from('contracts').select('value');
      
      // Por enquanto, mantemos um delay para simular a rede
      setTimeout(() => {
        setStats({
          revenue: "R$ 154.200,50",
          commissions: "R$ 23.130,00",
          users: "1.240",
          contracts: "42"
        });
        setLoading(false);
      }, 1000);
    };

    fetchStats();
  }, []);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Visão Geral</h1>
        <p className="text-slate-500 mt-1">Dados em tempo real do ecossistema DUSHOW.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Faturamento Total" 
          value={stats?.revenue} 
          icon={DollarSign} 
          trend="up" 
          trendValue="+12.5%" 
          loading={loading}
        />
        <StatCard 
          title="Comissões (15%)" 
          value={stats?.commissions} 
          icon={TrendingUp} 
          trend="up" 
          trendValue="+8.2%" 
          loading={loading}
        />
        <StatCard 
          title="Total de Usuários" 
          value={stats?.users} 
          icon={Users} 
          trend="up" 
          trendValue="+24%" 
          loading={loading}
        />
        <StatCard 
          title="Contratos Ativos" 
          value={stats?.contracts} 
          icon={Briefcase} 
          trend="down" 
          trendValue="-3.1%" 
          loading={loading}
        />
      </div>

      {/* Gráficos permanecem com dados mockados até termos histórico no DB */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6 border-none shadow-sm bg-white">
          <h3 className="text-lg font-bold mb-6">Faturamento vs Comissões</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[]}> {/* Dados virão do DB futuramente */}
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="faturamento" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;