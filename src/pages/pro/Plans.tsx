"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, Star, Zap, Crown, Shield, Loader2, Target } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

const PRO_PLANS = [
  { id: 'free', name: "Free", price: "R$ 0", tax: "15%", features: ["Perfil Básico", "Contratos Digitais", "Portfólio Limitado"] },
  { id: 'pro', name: "Pro", price: "R$ 49,90", tax: "10%", features: ["Portfólio Completo", "Destaque nas Buscas", "Agenda Integrada", "15% desc. Academy"], popular: true },
  { id: 'premium', name: "Premium", price: "R$ 99,90", tax: "7%", features: ["Selo Verificado", "Suporte Prioritário", "50% desc. Academy", "Eventos Exclusivos"] },
  { id: 'elite', name: "Elite", price: "R$ 199,90", tax: "2%", features: ["Selo Superstar", "Academy Total Free", "Gerente de Conta", "Visibilidade Máxima"] }
];

const CLIENT_PLANS = [
  { id: 'free', name: "Free", price: "R$ 0", features: ["Busca Básica", "Até 3 propostas/mês", "Chat limitado"] },
  { id: 'pro', name: "Pro", price: "R$ 29,90", features: ["Busca Avançada", "Chat Ilimitado", "Contratos Automáticos", "Selo Contratante Pro"], popular: true },
  { id: 'premium', name: "Premium", price: "R$ 79,90", features: ["Orçamentos Automáticos", "Ranking Confiável", "Agenda Integrada", "Clube de Vantagens"] },
  { id: 'elite', name: "Elite", price: "R$ 249,90", features: ["Dashboard Multi-eventos", "Multiusuário", "Relatórios Fiscais", "Suporte Dedicado"] }
];

const Plans = () => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
    }
  };

  const handleUpgrade = async (planId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({ 
        plan_tier: planId,
        is_verified: ['premium', 'elite'].includes(planId),
        is_superstar: planId === 'elite'
      }).eq('id', profile.id);
      
      if (error) throw error;
      showSuccess("Plano atualizado com sucesso!");
      fetchProfile();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black text-slate-900">Planos DUSHOW</h1>
        <p className="text-slate-500">Escolha o plano ideal para o seu perfil.</p>
      </div>

      <Tabs defaultValue={profile?.role === 'CLIENT' ? 'client' : 'pro'} className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="bg-white border p-1 h-12 rounded-xl">
            <TabsTrigger value="pro" className="rounded-lg px-8">Para Profissionais</TabsTrigger>
            <TabsTrigger value="client" className="rounded-lg px-8">Para Contratantes</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pro" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRO_PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} currentTier={profile?.plan_tier} onUpgrade={handleUpgrade} loading={loading} isPro />
          ))}
        </TabsContent>

        <TabsContent value="client" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CLIENT_PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} currentTier={profile?.plan_tier} onUpgrade={handleUpgrade} loading={loading} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const PlanCard = ({ plan, currentTier, onUpgrade, loading, isPro }: any) => {
  const isCurrent = currentTier === plan.id || (plan.id === 'free' && !currentTier);
  
  return (
    <Card className={cn(
      "p-6 border-none shadow-xl flex flex-col relative overflow-hidden transition-all hover:scale-[1.02]",
      plan.popular ? "ring-2 ring-indigo-600 bg-white" : "bg-white/80"
    )}>
      {plan.popular && <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>}
      <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
      <div className="mb-4">
        <span className="text-3xl font-black">{plan.price}</span>
        <span className="text-xs text-slate-400">/mês</span>
      </div>
      {isPro && <Badge className="mb-6 bg-indigo-50 text-indigo-600 border-none">Taxa: {plan.tax}</Badge>}
      
      <div className="space-y-3 flex-1 mb-8">
        {plan.features.map((f: string) => (
          <div key={f} className="flex items-start gap-2 text-xs text-slate-600">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {f}
          </div>
        ))}
      </div>

      <Button 
        onClick={() => onUpgrade(plan.id)} 
        disabled={loading || isCurrent}
        className={cn("w-full rounded-xl font-bold", isCurrent ? "bg-emerald-500" : "bg-slate-900")}
      >
        {isCurrent ? "Plano Ativo" : "Selecionar"}
      </Button>
    </Card>
  );
};

export default Plans;