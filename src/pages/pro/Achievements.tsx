"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Zap, Target, Award, Lock, CheckCircle2, Crown, Loader2 } from "lucide-react";
import { supabase } from '@/lib/supabase';

const ProAchievements = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>;

  const points = profile?.points || 0;
  const level = Math.floor(points / 1000) + 1;
  const nextLevelPoints = level * 1000;
  const progress = (points % 1000) / 10;

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <Card className="p-8 border-none shadow-lg bg-gradient-to-br from-indigo-600 to-purple-700 text-white overflow-hidden relative">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-md border-4 border-white/30 flex items-center justify-center text-4xl font-black">
            {level}
          </div>
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div>
              <h1 className="text-3xl font-bold">Nível de Prestígio</h1>
              <p className="text-indigo-100">Continue realizando shows para subir de nível!</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold">
                <span>{points} XP</span>
                <span>{nextLevelPoints} XP para o Nível {level + 1}</span>
              </div>
              <Progress value={progress} className="h-3 bg-white/20" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">Total de Pontos</p>
            <p className="text-3xl font-black">{points}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className={`p-6 border-none shadow-sm ${profile?.is_verified ? 'bg-white' : 'bg-slate-50 opacity-60'}`}>
          <div className="flex gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${profile?.is_verified ? 'bg-blue-50 text-blue-500' : 'bg-slate-200 text-slate-400'}`}>
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold">Selo Verificado</h4>
              <p className="text-xs text-slate-500">Identidade validada pela equipe.</p>
              {profile?.is_verified && <Badge className="mt-2 bg-emerald-50 text-emerald-600">Ativo</Badge>}
            </div>
          </div>
        </Card>

        <Card className={`p-6 border-none shadow-sm ${profile?.is_superstar ? 'bg-white' : 'bg-slate-50 opacity-60'}`}>
          <div className="flex gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${profile?.is_superstar ? 'bg-amber-50 text-amber-500' : 'bg-slate-200 text-slate-400'}`}>
              <Crown className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold">Superstar</h4>
              <p className="text-xs text-slate-500">Destaque premium na plataforma.</p>
              {profile?.is_superstar && <Badge className="mt-2 bg-emerald-50 text-emerald-600">Ativo</Badge>}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProAchievements;