"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Briefcase,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const data = [
  { name: 'Jan', faturamento: 4000, comissao: 400 },
  { name: 'Fev', faturamento: 3000, comissao: 300 },
  { name: 'Mar', faturamento: 2000, comissao: 200 },
  { name: 'Abr', faturamento: 2780, comissao: 278 },
  { name: 'Mai', faturamento: 1890, comissao: 189 },
  { name: 'Jun', faturamento: 2390, comissao: 239 },
  { name: 'Jul', faturamento: 3490, comissao: 349 },
];

const StatCard = ({ title, value, icon: Icon, trend, trendValue }: any) => (
  <Card className="p-6 border-none shadow-sm bg-white">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-slate-50 rounded-lg">
        <Icon className="w-6 h-6 text-indigo-600" />
      </div>
      <div className={cn(
        "flex items-center text-xs font-medium px-2 py-1 rounded-full",
        trend === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
      )}>
        {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
        {trendValue}
      </div>
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
    </div>
  </Card>
);

const AdminDashboard = () => {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Visão Geral</h1>
        <p className="text-slate-500 mt-1">Bem-vindo ao centro de comando da DUSHOW.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Faturamento Total" 
          value="R$ 154.200,50" 
          icon={DollarSign} 
          trend="up" 
          trendValue="+12.5%" 
        />
        <StatCard 
          title="Comissões (15%)" 
          value="R$ 23.130,00" 
          icon={TrendingUp} 
          trend="up" 
          trendValue="+8.2%" 
        />
        <StatCard 
          title="Novos Artistas" 
          value="128" 
          icon={Users} 
          trend="up" 
          trendValue="+24%" 
        />
        <StatCard 
          title="Contratos Ativos" 
          value="42" 
          icon={Briefcase} 
          trend="down" 
          trendValue="-3.1%" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6 border-none shadow-sm bg-white">
          <h3 className="text-lg font-bold mb-6">Faturamento vs Comissões</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="faturamento" stroke="#4f46e5" fillOpacity={1} fill="url(#colorFat)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-white">
          <h3 className="text-lg font-bold mb-6">Crescimento de Usuários</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="comissao" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

import { cn } from '@/lib/utils';
export default AdminDashboard;