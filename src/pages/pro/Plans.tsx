"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Crown, Shield, Loader2, Target, ArrowRight } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { cn } from "@/lib/utils";

const PRO_PLANS = [
  { 
    id: 'free', 
    name: "Free", 
    price: "R$ 0", 
    tax: "15%", 
    features: ["Perfil Básico", "Contratos Digitais", "Portfólio (3 fotos)"],
    color: "slate"
  },
  { 
    id: 'pro', 
    name: "Pro", 
    price: "R$ 49,90", 
    tax: "10%", 
    features: ["Portfólio Ilimitado", "Destaque nas Buscas", "Agenda Integrada", "15% desc. Academy"], 
    popular: true,
    color: "indigo"
  },
  { 
    id: 'premium', 
    name: "Premium", 
    price: "R$ 99,90", 
    tax: "7%", 
    features: ["Selo Verificado", "Suporte Prioritário", "50% desc. Academy", "Eventos Exclusivos"],
    color: "blue"
  },
  { 
    id: 'elite', 
    name: "Elite", 
    price: "R$ 199,90", 
    tax: "2%", 
    features: ["Selo Superstar", "Academy Total Free", "Gerente de Conta", "Visibilidade Máxima"],
    color: "amber"
  }
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

  const handleUpgrade = (plan: any) => {
    if (plan.id === 'free') return;
    navigate('/pro/plans/checkout', { state: { plan } });
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-12">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <Badge className="bg-indigo-100 text-indigo-600 hover:bg-indigo-100 border-none px-4 py-1">Upgrade de Carreira</Badge>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">Aumente seus ganhos, <span className="text-indigo-600">diminua suas taxas.</span></h1>
        <p className="text-slate-500 text-lg">Escolha o plano que melhor se adapta ao seu momento profissional.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PRO_PLANS.map((plan) => {
          const isCurrent = (profile?.plan_tier || 'free') === plan.id;
          
          return (
            <Card key={plan.id} className={cn(
              "p-8 border-none shadow-2xl flex flex-col relative overflow-hidden transition-all duration-500 hover:-translate-y-2",
              plan.popular ? "ring-4 ring-indigo-600 bg-white scale-105 z-10" : "bg-white/80",
              isCurrent && "ring-4 ring-emerald-500"
            )}>
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl">
                  MAIS VENDIDO
                </div>
              )}
              
              {isCurrent && (
                <div className="absolute top-0 left-0 bg-emerald-500 text-white text-[10px] font-black px-4 py-1.5 rounded-br-2xl">
                  PLANO ATUAL
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-black text-slate-900 mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                  <span className="text-xs text-slate-400 font-bold">/mês</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl mb-8 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Taxa de Serviço</p>
                <p className="text-2xl font-black text-indigo-600">{plan.tax}</p>
                <p className="text-[10px] text-slate-500">por contrato fechado</p>
              </div>
              
              <div className="space-y-4 flex-1 mb-10">
                {plan.features.map((f: string) => (
                  <div key={f} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                    <div className="mt-1 bg-emerald-100 rounded-full p-0.5">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    {f}
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => handleUpgrade(plan)} 
                disabled={isCurrent || plan.id === 'free'}
                className={cn(
                  "w-full h-14 rounded-2xl font-black text-lg transition-all",
                  isCurrent ? "bg-emerald-500 hover:bg-emerald-500" : 
                  plan.popular ? "bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100" : "bg-slate-900"
                )}
              >
                {isCurrent ? "Plano Ativo" : plan.id === 'free' ? "Plano Inicial" : "Fazer Upgrade"}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Comparativo de Economia */}
      <Card className="p-8 border-none shadow-xl bg-slate-900 text-white rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-2">
          <h3 className="text-2xl font-black">Economize até R$ 1.300,00 por show</h3>
          <p className="text-slate-400">No plano Elite, você retém 98% do seu cachê. A plataforma que mais valoriza o artista.</p>
        </div>
        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 h-14 px-8 rounded-2xl font-bold">
          Ver Tabela Comparativa
        </Button>
      </Card>
    </div>
  );
};

export default Plans;