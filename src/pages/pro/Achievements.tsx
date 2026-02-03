"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Star, 
  Zap, 
  Target, 
  Award, 
  Lock, 
  CheckCircle2, 
  TrendingUp,
  Flame,
  Crown
} from "lucide-react";

const BADGES = [
  { id: 1, name: "Selo Verificado", icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-50", unlocked: true, desc: "Identidade validada pela equipe Dushow." },
  { id: 2, name: "Superstar", icon: Crown, color: "text-amber-500", bg: "bg-amber-50", unlocked: true, desc: "Assinante do plano máximo com visibilidade premium." },
  { id: 3, name: "Pista Cheia", icon: Flame, color: "text-orange-500", bg: "bg-orange-50", unlocked: true, desc: "Realizou mais de 50 shows com avaliação 5 estrelas." },
  { id: 4, name: "Mestre do Rider", icon: Zap, color: "text-purple-500", bg: "bg-purple-50", unlocked: false, desc: "Preencha 100% das informações técnicas do seu perfil." },
  { id: 5, name: "Top 10 Semanal", icon: Trophy, color: "text-indigo-500", bg: "bg-indigo-50", unlocked: false, desc: "Fique entre os 10 artistas mais buscados da semana." },
];

const MISSIONS = [
  { id: 1, title: "Completar Portfólio", progress: 80, reward: "+200 XP", icon: Target },
  { id: 2, title: "Postar no Feed (3/5)", progress: 60, reward: "+50 XP", icon: Zap },
  { id: 3, title: "Responder Orçamentos", progress: 100, reward: "+100 XP", icon: CheckCircle2, completed: true },
];

const ProAchievements = () => {
  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Level Header */}
      <Card className="p-8 border-none shadow-lg bg-gradient-to-br from-indigo-600 to-purple-700 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Trophy size={160} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-md border-4 border-white/30 flex items-center justify-center text-4xl font-black">
            12
          </div>
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div>
              <h1 className="text-3xl font-bold">Nível de Prestígio</h1>
              <p className="text-indigo-100">Você está no Top 5% dos artistas mais ativos este mês!</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold">
                <span>1.250 XP</span>
                <span>1.500 XP para o Nível 13</span>
              </div>
              <Progress value={83} className="h-3 bg-white/20" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">Total de Pontos</p>
            <p className="text-3xl font-black">12.450</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Badges Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Minhas Medalhas</h2>
            <span className="text-sm text-slate-500 font-medium">3 de 12 desbloqueadas</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BADGES.map((badge) => (
              <Card key={badge.id} className={`p-5 border-none shadow-sm transition-all ${badge.unlocked ? 'bg-white' : 'bg-slate-50 opacity-70'}`}>
                <div className="flex gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${badge.unlocked ? badge.bg : 'bg-slate-200'}`}>
                    {badge.unlocked ? (
                      <badge.icon className={`w-8 h-8 ${badge.color}`} />
                    ) : (
                      <Lock className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h4 className={`font-bold ${badge.unlocked ? 'text-slate-900' : 'text-slate-400'}`}>{badge.name}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{badge.desc}</p>
                    {badge.unlocked && (
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none text-[10px] mt-2">
                        Ativo no Perfil
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Missions & Ranking */}
        <div className="space-y-8">
          {/* Missions */}
          <Card className="p-6 border-none shadow-sm bg-white">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              Missões de XP
            </h3>
            <div className="space-y-6">
              {MISSIONS.map((mission) => (
                <div key={mission.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <mission.icon className={`w-4 h-4 ${mission.completed ? 'text-emerald-500' : 'text-slate-400'}`} />
                      <span className={`text-sm font-bold ${mission.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {mission.title}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-indigo-600">{mission.reward}</span>
                  </div>
                  <Progress value={mission.progress} className="h-1.5" />
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-6 text-xs font-bold">Ver Todas as Missões</Button>
          </Card>

          {/* Mini Ranking */}
          <Card className="p-6 border-none shadow-sm bg-slate-900 text-white">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Ranking DJs
            </h3>
            <div className="space-y-4">
              {[
                { name: "DJ Alok", pts: "12.450", rank: 1, me: true },
                { name: "DJ Vintage", pts: "11.200", rank: 2 },
                { name: "DJ Anna", pts: "9.800", rank: 3 },
              ].map((item) => (
                <div key={item.name} className={`flex items-center justify-between p-2 rounded-xl ${item.me ? 'bg-white/10 ring-1 ring-white/20' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-bold ${
                      item.rank === 1 ? 'bg-amber-500' : item.rank === 2 ? 'bg-slate-400' : 'bg-orange-700'
                    }`}>
                      {item.rank}
                    </span>
                    <span className="text-sm font-medium">{item.name} {item.me && "(Você)"}</span>
                  </div>
                  <span className="text-sm font-bold">{item.pts}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProAchievements;