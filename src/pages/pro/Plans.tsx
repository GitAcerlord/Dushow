"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Crown, Rocket, Loader2 } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

const proPlans = [
  { 
    id: 'free', 
    name: "Free", 
    price: "R$ 0", 
    commission: "15%",
    features: ["Perfil Básico", "Contratos Digitais", "Portfólio Limitado", "Visibilidade Padrão"],
    color: "bg-slate-100 text-slate-600"
  },
  { 
    id: 'pro', 
    name: "Pro", 
    price: "R$ 49,90", 
    commission: "10%",
    features: ["Portfólio Completo", "Destaque nas Buscas", "Agenda Integrada", "15% desc. Academy"],
    popular: true,
    color: "bg-indigo-600 text-white"
  },
  { 
    id: 'premium', 
    name: "Premium", 
    price: "R$ 99,90", 
    commission: "7%",
    features: ["Selo Verificado", "Suporte Prioritário", "Acesso a Eventos Exclusivos", "50% desc. Academy"],
    color: "bg-purple-600 text-white"
  },
  { 
    id: 'elite', 
    name: "Elite", 
    price: "R$ 199,90", 
    commission: "2%",
    features: ["Gerente de Conta", "Academy Total Free", "Selo Superstar", "Visibilidade Máxima"],
    color: "bg-amber-500 text-white"
  }
];

const ProPlans = () => {
  const [loading, setLoading] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setCurrentProfile(data);
    }
  };

  const handleUpgrade = async (plan: any) => {
    setLoading(true);
    try {
      const updates: any = {
        plan_tier: plan.id,
        is_verified: plan.id !== 'free',
        is_superstar: plan.id === 'elite'
      };

      const { error } = await supabase.from('profiles').update(updates).eq('id', currentProfile.id);
      if (error) throw error;

      showSuccess(`Plano ${plan.name} ativado! Taxa de comissão reduzida para ${plan.commission}.`);
      fetchProfile();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-12 max-w-7xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black text-slate-900">Planos Profissionais</h1>
        <p className="text-slate-500">Escolha o nível que melhor impulsiona sua carreira.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {proPlans.map((plan) => {
          const isCurrent = currentProfile?.plan_tier === plan.id || (plan.id === 'free' && !currentProfile?.plan_tier);

          return (
            <Card key={plan.id} className={cn(
              "p-6 border-none shadow-xl flex flex-col transition-all duration-300 relative overflow-hidden",
              plan.popular ? 'ring-2 ring-indigo-600 scale-105 z-10 bg-white' : 'bg-white/80',
              isCurrent && "border-2 border-emerald-500"
            )}>
              {plan.popular && <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">MAIS POPULAR</div>}
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                <p className="text-3xl font-black mt-2">{plan.price}</p>
                <Badge variant="outline" className="mt-2 text-indigo-600 border-indigo-100">Taxa: {plan.commission}</Badge>
              </div>

              <div className="space-y-3 flex-1 mb-8">
                {plan.features.map(f => (
                  <div key={f} className="flex items-start gap-2 text-xs text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {f}
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => handleUpgrade(plan)} 
                disabled={loading || isCurrent}
                className={cn(
                  "w-full h-11 rounded-xl font-bold",
                  plan.id === 'elite' ? "bg-amber-500 hover:bg-amber-600" : 
                  plan.popular ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-900 hover:bg-slate-800"
                )}
              >
                {loading ? <Loader2 className="animate-spin" /> : isCurrent ? "Plano Ativo" : "Assinar"}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ProPlans;