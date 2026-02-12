"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trophy, Share2, Loader2, Crown, Zap } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
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
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      showSuccess("Código de indicação copiado!");
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  const xp = Math.max(0, profile?.xp_total || 0);
  const level = profile?.level || 1;
  const nextLevelXp = level * 1000;
  const currentLevelXp = (level - 1) * 1000;
  const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

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
                <p className="text-indigo-100">Você acumulou {xp} XP até agora!</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-bold">
                <span>{xp} XP</span>
                <span>{nextLevelXp} XP para o Nível {level + 1}</span>
              </div>
              <Progress value={progress} className="h-4 bg-white/20" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black uppercase text-indigo-200">Pontos por Posts</p>
                <p className="text-2xl font-black">5 XP / post</p>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black uppercase text-indigo-200">Pontos por Show</p>
                <p className="text-2xl font-black">100 XP / show</p>
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
              Compartilhe seu código e ganhe XP por cada novo usuário que se cadastrar.
            </p>
          </div>
          <div className="space-y-4 mt-8">
            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Seu Código</p>
              <p className="text-2xl font-black text-indigo-600 tracking-widest">{profile?.referral_code || 'DUSHOW10'}</p>
            </div>
            <Button onClick={copyReferralCode} className="w-full h-12 bg-indigo-600 rounded-xl font-bold">Copiar Código</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProAchievements;