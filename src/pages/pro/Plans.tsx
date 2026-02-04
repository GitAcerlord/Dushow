"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Star, Zap, Shield, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from "@/utils/toast";

const plans = [
  { name: "Free", price: "R$ 0", features: ["Perfil básico", "Comissão de 20%"], id: 'free' },
  { name: "Pro", price: "R$ 49,90", features: ["Selo Verificado", "Comissão 15%"], id: 'pro', popular: true },
  { name: "Superstar", price: "R$ 149,90", features: ["Selo Superstar", "Comissão 10%"], id: 'superstar' }
];

const ProPlans = () => {
  const [loading, setLoading] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setCurrentProfile(data);
      }
    };
    fetchProfile();
  }, []);

  const handleUpgrade = async (planId: string) => {
    setLoading(true);
    try {
      const updates: any = {};
      if (planId === 'pro') updates.is_verified = true;
      if (planId === 'superstar') {
        updates.is_verified = true;
        updates.is_superstar = true;
      }

      const { error } = await supabase.from('profiles').update(updates).eq('id', currentProfile.id);
      if (error) throw error;

      showSuccess(`Upgrade para ${planId.toUpperCase()} realizado com sucesso!`);
      window.location.reload();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-12 max-w-6xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black text-slate-900">Escolha seu nível</h1>
        <p className="text-slate-500">Aumente sua visibilidade e reduza suas taxas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card key={plan.id} className={`p-8 border-none shadow-xl flex flex-col ${plan.popular ? 'ring-2 ring-indigo-600 scale-105 bg-white' : 'bg-white/80'}`}>
            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
            <p className="text-3xl font-black mb-6">{plan.price}</p>
            <div className="space-y-4 flex-1 mb-8">
              {plan.features.map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-emerald-500" /> {f}
                </div>
              ))}
            </div>
            <Button 
              onClick={() => handleUpgrade(plan.id)} 
              disabled={loading || (plan.id === 'pro' && currentProfile?.is_verified) || (plan.id === 'superstar' && currentProfile?.is_superstar)}
              className="w-full bg-indigo-600"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Selecionar Plano"}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProPlans;