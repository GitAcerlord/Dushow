"use client";

import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { DollarSign, Calendar, Star, TrendingUp, Award, Loader2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

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

      // Busca perfil real
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      
      // Busca contratos reais para calcular ganhos
      const { data: contracts } = await supabase
        .from('contracts')
        .select('valor_atual, status')
        .eq('profissional_profile_id', user.id);

      // Ganhos: Apenas contratos pagos ou concluídos
      const totalEarnings = contracts?.filter(c => ['PAGO', 'COMPLETED', 'PAID'].includes(c.status))
        .reduce((acc, curr) => acc + Number(curr.valor_atual), 0) || 0;

      // Shows Confirmados: Contratos assinados ou pagos que ainda não foram concluídos
      const upcomingShows = contracts?.filter(c => ['ASSINADO', 'PAGO', 'SIGNED', 'PAID'].includes(c.status)).length || 0;

      setStats({
        profile,
        totalEarnings,
        upcomingShows
      });
    } catch (error) {
      console.error("[ProDashboard] Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-[#2D1B69]" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2D1B69]">Olá, {stats.profile?.full_name || 'Artista'}! 👋</h1>
          <p className="text-slate-500 mt-1">Seu resumo financeiro e de agenda em tempo real.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {stats.profile?.is_superstar && <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-xs font-black border border-amber-100"><Award className="w-3 h-3" /> Superstar</div>}
          {stats.profile?.is_verified && <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-black border border-blue-100"><Star className="w-3 h-3 fill-current" /> Verificado</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Ganhos Totais" value={`R$ ${stats.totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={DollarSign} color="emerald" />
        <StatCard title="Shows Confirmados" value={`${stats.upcomingShows} Eventos`} icon={Calendar} color="indigo" />
        <StatCard title="Avaliação" value={`${stats.profile?.rating || '5.0'} / 5.0`} icon={Star} color="amber" />
        <StatCard title="Pontos XP" value={`${stats.profile?.xp_total || 0} pts`} icon={TrendingUp} color="purple" />
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <Card className="p-6 border-none shadow-sm bg-white hover:shadow-md transition-all">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl bg-${color}-50`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <h3 className="text-xl font-black text-[#2D1B69]">{value}</h3>
      </div>
    </div>
  </Card>
);

export default ProDashboard;