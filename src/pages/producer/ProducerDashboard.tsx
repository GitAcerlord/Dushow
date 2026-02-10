"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Ticket, Users, TrendingUp, DollarSign, Megaphone, GraduationCap, 
  ArrowUpRight, Loader2, Calendar, MapPin, Share2
} from "lucide-react";
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
          <Button className="bg-indigo-600 rounded-xl gap-2 font-bold">
            <Ticket className="w-4 h-4" /> Criar Novo Lote
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
        {/* Gestão de Marketing */}
        <Card className="lg:col-span-2 p-8 border-none shadow-xl bg-white rounded-[3rem] space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                <Megaphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Impulsionar Evento</h3>
            </div>
            <Badge className="bg-indigo-100 text-indigo-600 border-none">Beta</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-slate-50 rounded-[2rem] space-y-4 border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer group">
              <h4 className="font-black text-slate-900">Pacote Tráfego Pago</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Gestão profissional de anúncios no Meta e Google Ads operada pela DUSHOW.</p>
              <Button variant="ghost" className="p-0 text-indigo-600 font-bold group-hover:translate-x-1 transition-transform">Contratar Agora <ArrowUpRight className="w-4 h-4 ml-1" /></Button>
            </div>
            <div className="p-6 bg-slate-50 rounded-[2rem] space-y-4 border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer group">
              <h4 className="font-black text-slate-900">DUSHOW Academy</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Módulo exclusivo: "Como esgotar lotes em 24 horas" aplicado ao seu evento.</p>
              <Button variant="ghost" className="p-0 text-indigo-600 font-bold group-hover:translate-x-1 transition-transform">Acessar Conteúdo <GraduationCap className="w-4 h-4 ml-1" /></Button>
            </div>
          </div>
        </Card>

        {/* Split de Pagamento */}
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
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Afiliados (5%)</span>
              <span className="font-bold">R$ 2.260,00</span>
            </div>
            <div className="pt-4 border-t border-white/10">
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Valores em Escrow. Liberação automática 48h após o evento.
              </p>
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
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
    <h3 className="text-2xl font-black text-slate-900 mt-1">{value}</h3>
  </Card>
);

export default ProducerDashboard;