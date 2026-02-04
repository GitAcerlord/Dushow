"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Zap, Target, Award, Share2, Users, Crown, Loader2, Gift } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { showSuccess } from '@/utils/toast';

const ProAchievements = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
    }
    setLoading(false);
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(profile.referral_code);
    showSuccess("Código de indicação copiado!");
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>;

  const points = profile?.points || 0;
  const level = Math.floor(points / 1000) + 1;
  const progress = (points % 1000) / 10;

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Level Card */}
        <Card className="lg:col-span-2 p-8 border-none shadow-2xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-[2.5rem] relative overflow-hidden">
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-4xl font-black">
                {level}
              </div>
              <div>
                <h2 className="text-3xl font-black">Nível de Prestígio</h2>
                <p className="text-indigo-100">Você está entre os {100 - level}% melhores da plataforma!</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-bold">
                <span>{points} XP</span>
                <span>{level * 1000} XP para o Nível {level + 1}</span>
              </div>
              <Progress value={progress} className="h-4 bg-white/20" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black uppercase text-indigo-200">Pontos por Posts</p>
                <p className="text-2xl font-black">5 pts / post</p>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black uppercase text-indigo-200">Pontos por Indicação</p>
                <p className="text-2xl font-black">50 pts / user</p>
              </div>
            </div>
          </div>
          <Trophy className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5 -rotate-12" />
        </Card>

        {/* Referral Card */}
        <Card className="p-8 border-none shadow-xl bg-white rounded-[2.5rem] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <Share2 className="text-emerald-600 w-7 h-7" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">Indique e Ganhe</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Compartilhe seu código. A cada 1000 pontos, ganhe 10% de desconto ou 2h de destaque no topo das buscas!
            </p>
          </div>
          <div className="space-y-4 mt-8">
            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Seu Código</p>
              <p className="text-2xl font-black text-indigo-600 tracking-widest">{profile.referral_code}</p>
            </div>
            <Button onClick={copyReferralCode} className="w-full h-12 bg-indigo-600 rounded-xl font-bold">Copiar Código</Button>
          </div>
        </Card>
      </div>

      {/* Ambassador Status */}
      <Card className="p-8 border-none shadow-sm bg-amber-50 rounded-[2.5rem] border border-amber-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
            <Crown className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black text-amber-900">Programa de Embaixadores</h3>
            <p className="text-sm text-amber-700">Indique 20 pessoas/mês e ganhe **Isenção Total de Mensalidade**!</p>
          </div>
        </div>
        <div className="text-center md:text-right">
          <p className="text-xs font-bold text-amber-600 uppercase mb-1">Progresso Mensal</p>
          <p className="text-3xl font-black text-amber-900">{profile.referral_count || 0} / 20</p>
        </div>
      </Card>
    </div>
  );
};

export default ProAchievements;