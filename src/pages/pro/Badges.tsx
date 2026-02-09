"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, Star, Crown, CheckCircle2, 
  Clock, ArrowRight, Loader2, AlertCircle, Award
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

const BADGE_PLANS = [
  {
    id: 'verified',
    name: 'Selo Verificado',
    icon: ShieldCheck,
    color: 'blue',
    price: 49.90,
    duration: 'Vitalício',
    benefits: [
      'Badge oficial de verificação',
      'Prioridade nos resultados de busca',
      'Aumento de 40% na confiança do cliente',
      'Suporte prioritário via chat'
    ]
  },
  {
    id: 'superstar',
    name: 'Selo Super Star',
    icon: Crown,
    color: 'amber',
    price: 149.90,
    duration: '30 dias',
    benefits: [
      'Destaque máximo no feed social',
      'Perfil promovido na home do contratante',
      'Taxa de serviço reduzida em 5%',
      'Acesso antecipado a novos recursos'
    ]
  }
];

const Badges = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

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

  const handlePurchase = async (badgeId: string) => {
    setProcessingId(badgeId);
    try {
      // Chamada real para processamento financeiro
      const { data, error } = await supabase.functions.invoke('process-subscription', {
        body: { 
          planId: badgeId === 'verified' ? 'premium' : 'elite',
          planName: badgeId.toUpperCase()
        }
      });

      if (error) throw error;

      showSuccess(`Selo ${badgeId === 'verified' ? 'Verificado' : 'Super Star'} ativado com sucesso!`);
      await fetchProfile();
    } catch (error: any) {
      showError(error.message || "Erro ao processar pagamento.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900">Meus Selos de Prestígio</h1>
        <p className="text-slate-500">Aumente sua autoridade e conquiste mais contratos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {BADGE_PLANS.map((plan) => {
          const isActive = plan.id === 'verified' ? profile?.is_verified : profile?.is_superstar;
          const Icon = plan.icon;

          return (
            <Card key={plan.id} className={cn(
              "p-8 border-none shadow-xl bg-white rounded-[3rem] flex flex-col relative overflow-hidden transition-all",
              isActive && "ring-4 ring-emerald-500"
            )}>
              {isActive && (
                <div className="absolute top-6 right-6 bg-emerald-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Ativo
                </div>
              )}

              <div className="flex items-center gap-4 mb-8">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg",
                  plan.color === 'blue' ? "bg-blue-600 text-white" : "bg-amber-500 text-white"
                )}>
                  <Icon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">{plan.name}</h3>
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-tighter">
                    R$ {plan.price.toLocaleString('pt-BR')} • {plan.duration}
                  </p>
                </div>
              </div>

              <div className="space-y-4 flex-1 mb-10">
                {plan.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    {benefit}
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => handlePurchase(plan.id)}
                disabled={isActive || processingId === plan.id}
                className={cn(
                  "w-full h-14 rounded-2xl font-black text-lg shadow-xl transition-all",
                  isActive 
                    ? "bg-slate-100 text-slate-400 cursor-default" 
                    : plan.color === 'blue' ? "bg-blue-600 hover:bg-blue-700" : "bg-amber-500 hover:bg-amber-600"
                )}
              >
                {processingId === plan.id ? <Loader2 className="animate-spin" /> : isActive ? "Selo Já Ativo" : "Adquirir Agora"}
              </Button>
            </Card>
          );
        })}
      </div>

      <Card className="p-8 border-none shadow-sm bg-slate-900 text-white rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <AlertCircle className="text-amber-400" />
          </div>
          <div>
            <h4 className="font-bold">Por que ser verificado?</h4>
            <p className="text-sm text-slate-400">Contratantes preferem profissionais com identidade validada pela plataforma.</p>
          </div>
        </div>
        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-xl font-bold" asChild>
          <a href="/about">Saiba mais sobre segurança</a>
        </Button>
      </Card>
    </div>
  );
};

export default Badges;