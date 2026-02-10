"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Ticket, Users, TrendingUp, DollarSign, Megaphone, GraduationCap, 
  ArrowUpRight, Loader2, Calendar, MapPin, Share2, QrCode, BarChart3
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';

const ProducerDashboard = () => {
  const [stats, setStats] = useState({
    ticketsSold: 1240,
    revenue: 45200.00,
    conversion: 12.5,
    activeEvents: 2
  });
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Painel do Produtor</h1>
          <p className="text-slate-500">Gerencie sua bilheteria e impulsione suas vendas.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl gap-2 border-slate-200 font-bold">
            <Share2 className="w-4 h-4" /> Link da Bilheteria
          </Button>
          <Button className="bg-indigo-600 rounded-xl gap-2 font-bold" asChild>
            <Link to="/app/discovery"><Ticket className="w-4 h-4" /> Contratar Novo Artista</Link>
          </Button>
        </div>
      </div>

      {/* Métricas de Bilheteria */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Ingressos Vendidos" value={stats.ticketsSold} icon={Users} color="blue" />
        <StatCard title="Receita Bruta" value={`R$ ${stats.revenue.toLocaleString('pt-BR')}`} icon={DollarSign} color="emerald" />
        <StatCard title="Taxa de Conversão" value={`${stats.conversion}%`} icon={TrendingUp} color="indigo" />
        <StatCard title="Eventos Ativos" value={stats.activeEvents} icon={Calendar} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gestão de Eventos Ativos */}
        <Card className="lg:col-span-2 p-8 border-none shadow-xl bg-white rounded-[3rem] space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="text-indigo-600" /> Eventos com Bilheteria Aberta
            </h3>
          </div>

          <div className="space-y-4">
            {[1].map((i) => (
              <div key={i} className="p-6 bg-slate-50 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <Calendar className="text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900">Sunset Party feat. DJ Alok</h4>
                    <p className="text-xs text-slate-500">24 de Junho • Arena DUSHOW</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-xl font-bold border-slate-200">Relatório</Button>
                  <Button size="sm" className="bg-indigo-600 rounded-xl font-bold gap-2">
                    <QrCode className="w-4 h-4" /> Portaria
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Split de Pagamento & Marketing */}
        <div className="space-y-6">
          <Card className="p-8 border-none shadow-xl bg-slate-900 text-white rounded-[3rem] space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg"><DollarSign className="w-5 h-5" /></div>
              <h3 className="font-black">Split Automático</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Sua Parte (85%)</span>
                <span className="font-bold">R$ 38.420,00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Taxa DUSHOW (10%)</span>
                <span className="font-bold">R$ 4.520,00</span>
              </div>
              <div className="pt-4 border-t border-white/10">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Valores em Escrow. Liberação automática 48h após o evento.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-8 border-none shadow-xl bg-indigo-50 rounded-[3rem] space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <Megaphone className="w-5 h-5" />
              <h3 className="font-black">Afiliados</h3>
            </div>
            <p className="text-xs text-indigo-900/60 font-medium">Crie links de rastreio para influenciadores e pague comissão por venda.</p>
            <Button className="w-full bg-indigo-600 rounded-xl font-bold">Gerar Link de Afiliado</Button>
          </Card>
        </div>
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
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
    <h3 className="text-2xl font-black text-slate-900 mt-1">{value}</h3>
  </Card>
);

export default ProducerDashboard;