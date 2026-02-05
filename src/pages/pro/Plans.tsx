"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Crown, Loader2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { cn } from "@/lib/utils";

const PRO_PLANS = [
  { id: 'free', name: "Free", price: "R$ 0", tax: "15%", features: ["Perfil Básico", "Contratos Digitais", "Portfólio (3 fotos)"] },
  { id: 'pro', name: "Pro", price: "R$ 49,90", tax: "10%", features: ["Portfólio Ilimitado", "Destaque nas Buscas", "Agenda Integrada"], popular: true },
  { id: 'premium', name: "Premium", price: "R$ 99,90", tax: "7%", features: ["Selo Verificado", "Suporte Prioritário", "Academy 50% OFF"] },
  { id: 'elite', name: "Elite", price: "R$ 199,90", tax: "2%", features: ["Selo Superstar", "Gerente de Conta", "Visibilidade Máxima"] }
];

const CLIENT_PLANS = [
  { id: 'free', name: "Standard", price: "R$ 0", features: ["Busca de Artistas", "Contratos Seguros", "Chat Ilimitado"] },
  { id: 'vip', name: "VIP Client", price: "R$ 29,90", features: ["Taxas de Serviço Reduzidas", "Suporte 24h", "Prioridade em Propostas"], popular: true },
  { id: 'business', name: "Business", price: "R$ 89,90", features: ["Gestão de Múltiplos Eventos", "Relatórios Financeiros", "Concierge DUSHOW"] }
];

const Plans = () => {
  const navigate = useNavigate();
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

  const plansToShow = profile?.role === 'CLIENT' ? CLIENT_PLANS : PRO_PLANS;

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-12">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <Badge className="bg-indigo-100 text-indigo-600 border-none px-4 py-1">Upgrade de Conta</Badge>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">
          {profile?.role === 'CLIENT' ? "Experiência VIP para seus eventos" : "Aumente seus ganhos profissionais"}
        </h1>
        <p className="text-slate-500 text-lg">Escolha o plano ideal para o seu perfil {profile?.role}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plansToShow.map((plan: any) => {
          const isCurrent = (profile?.plan_tier || 'free') === plan.id;
          return (
            <Card key={plan.id} className={cn(
              "p-8 border-none shadow-2xl flex flex-col relative overflow-hidden transition-all",
              plan.popular ? "ring-4 ring-indigo-600 bg-white scale-105 z-10" : "bg-white/80",
              isCurrent && "ring-4 ring-emerald-500"
            )}>
              <div className="mb-8">
                <h3 className="text-xl font-black text-slate-900 mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                  <span className="text-xs text-slate-400 font-bold">/mês</span>
                </div>
              </div>

              {plan.tax && (
                <div className="p-4 bg-slate-50 rounded-2xl mb-8 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Taxa de Serviço</p>
                  <p className="text-2xl font-black text-indigo-600">{plan.tax}</p>
                </div>
              )}
              
              <div className="space-y-4 flex-1 mb-10">
                {plan.features.map((f: string) => (
                  <div key={f} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> {f}
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => navigate('/pro/plans/checkout', { state: { plan } })} 
                disabled={isCurrent || plan.id === 'free'}
                className={cn(
                  "w-full h-14 rounded-2xl font-black text-lg",
                  isCurrent ? "bg-emerald-500" : plan.popular ? "bg-indigo-600" : "bg-slate-900"
                )}
              >
                {isCurrent ? "Plano Ativo" : "Selecionar"}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Plans;