"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { 
  Star, 
  Users, 
  DollarSign, 
  Calendar,
  Award,
  TrendingUp
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const performanceData = [
  { name: 'Seg', views: 120 },
  { name: 'Ter', views: 150 },
  { name: 'Qua', views: 450 },
  { name: 'Qui', views: 320 },
  { name: 'Sex', views: 890 },
  { name: 'Sab', views: 1200 },
  { name: 'Dom', views: 600 },
];

const contractData = [
  { name: 'Concluídos', value: 12, color: '#10b981' },
  { name: 'Em Aberto', value: 3, color: '#6366f1' },
  { name: 'Cancelados', value: 1, color: '#ef4444' },
];

const ProDashboard = () => {
  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Olá, DJ Alok! 👋</h1>
          <p className="text-slate-500 mt-1">Seu perfil teve um aumento de 24% em visibilidade esta semana.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-sm font-bold border border-amber-100">
            <Award className="w-4 h-4" />
            Superstar
          </div>
          <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-bold border border-blue-100">
            <Star className="w-4 h-4 fill-current" />
            Verificado
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Ganhos no Mês</p>
              <h3 className="text-xl font-bold text-slate-900">R$ 12.450,00</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Próximos Shows</p>
              <h3 className="text-xl font-bold text-slate-900">04 Eventos</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl">
              <Star className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Avaliação Média</p>
              <h3 className="text-xl font-bold text-slate-900">4.9 / 5.0</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Pontos Dushow</p>
              <h3 className="text-xl font-bold text-slate-900">1.250 pts</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Visibilidade Chart */}
        <Card className="lg:col-span-2 p-6 border-none shadow-sm bg-white">
          <h3 className="text-lg font-bold mb-6">Visibilidade do Perfil (Cliques)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={4} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Contracts Chart */}
        <Card className="p-6 border-none shadow-sm bg-white">
          <h3 className="text-lg font-bold mb-6">Status de Contratos</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={contractData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {contractData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {contractData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProDashboard;