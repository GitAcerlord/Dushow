"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Shield, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

const plans = [
  { name: "Free", price: "R$ 0", features: ["Perfil básico", "Comissão de 20%"], id: 'free', value: 0 },
  { name: "Pro", price: "R$ 49,90", features: ["Selo Verificado Automático", "Comissão 15%", "Destaque em buscas"], id: 'pro', popular: true, value: 49.90 },
  { name: "Superstar", price: "R$ 149,90", features: ["Selo Superstar", "Selo Verificado", "Comissão 10%", "Suporte Prioritário"], id: 'superstar', value: 149.90 }
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
        role: 'PRO'
      };

      if (plan.id === 'pro') {
        updates.is_verified = true;
        updates.is_superstar = false;
      } else if (plan.id === 'superstar') {
        updates.is_verified = true;
        updates.is_superstar = true;
      } else {
        updates.is_verified = false;
        updates.is_superstar = false;
      }

      const { error } = await supabase.from('profiles').update(updates).eq('id', currentProfile.id);
      if (error) throw error;

      showSuccess(`Plano ${plan.name} ativado! Cobrança mensal de ${plan.price} configurada.`);
      fetchProfile();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-12 max-w-6xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black text-slate-900">Escolha seu nível</h1>
        <p className="text-slate-500">Aumente sua visibilidade e reduza suas taxas de comissão.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isCurrent = (plan.id === 'pro' && currentProfile?.is_verified && !currentProfile?.is_superstar) || 
                            (plan.id === 'superstar' && currentProfile?.is_superstar) ||
                            (plan.id === 'free' && !currentProfile?.is_verified && !currentProfile?.is_superstar);

          return (
            <Card key={plan.id} className={cn(
              "p-8 border-none shadow-xl flex flex-col transition-all duration-300",
              plan.popular ? 'ring-2 ring-indigo-600 md:scale-105 bg-white' : 'bg-white/80',
              isCurrent && "opacity-75 border-2 border-emerald-500"
            )}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                {isCurrent && <Badge className="bg-emerald-500">Plano Atual</Badge>}
              </div>
              <p className="text-3xl font-black mb-6">{plan.price}<span className="text-sm text-slate-400 font-normal">/mês</span></p>
              <div className="space-y-4 flex-1 mb-8">
                {plan.features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500" /> {f}
                  </div>
                ))}
              </div>
              <Button 
                onClick={() => handleUpgrade(plan)} 
                disabled={loading || isCurrent}
                className={cn(
                  "w-full h-12 rounded-xl font-bold",
                  plan.popular ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-900 hover:bg-slate-800"
                )}
              >
                {loading ? <Loader2 className="animate-spin" /> : isCurrent ? "Plano Ativo" : "Selecionar Plano"}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ProPlans;