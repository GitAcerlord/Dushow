"use client";

import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { DollarSign, Calendar, Star, TrendingUp, Award, Loader2 } from "lucide-react";
import { supabase } from '@/lib/supabase';

const ProDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Busca perfil para pontos e selos
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      
      // Busca contratos para ganhos e contagem
      const { data: contracts } = await supabase.from('contracts').select('value, status').eq('pro_id', user.id);

      const totalEarnings = contracts?.filter(c => c.status === 'PAID' || c.status === 'COMPLETED')
        .reduce((acc, curr) => acc + Number(curr.value), 0) || 0;

      const upcomingShows = contracts?.filter(c => c.status === 'PAID').length || 0;

      setStats({
        profile,
        totalEarnings,
        upcomingShows
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>;

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Olá, {stats.profile.full_name}! 👋</h1>
          <p className="text-slate-500 mt-1">Seu painel está atualizado com os dados do banco.</p>
        </div>
        <div className="flex gap-2">
          {stats.profile.is_superstar && <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-sm font-bold border border-amber-100"><Award className="w-4 h-4" /> Superstar</div>}
          {stats.profile.is_verified && <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-bold border border-blue-100"><Star className="w-4 h-4 fill-current" /> Verificado</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl"><DollarSign className="w-6 h-6 text-emerald-600" /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Ganhos Totais</p>
              <h3 className="text-xl font-bold text-slate-900">R$ {stats.totalEarnings.toLocaleString('pt-BR')}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl"><Calendar className="w-6 h-6 text-indigo-600" /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Shows Confirmados</p>
              <h3 className="text-xl font-bold text-slate-900">{stats.upcomingShows} Eventos</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl"><Star className="w-6 h-6 text-amber-600" /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Avaliação</p>
              <h3 className="text-xl font-bold text-slate-900">{stats.profile.rating} / 5.0</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-xl"><TrendingUp className="w-6 h-6 text-purple-600" /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Pontos</p>
              <h3 className="text-xl font-bold text-slate-900">{stats.profile.points} pts</h3>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProDashboard;