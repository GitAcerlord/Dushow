"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Star, Zap, Crown, Loader2, Percent } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { cn } from "@/lib/utils";

const PRO_PLANS = [
  { id: 'free', name: "Standard", monthly: 0, annual: 0, tax: "10%", features: ["Perfil Básico", "Contratos Digitais", "Portfólio (3 fotos)"] },
  { id: 'pro', name: "Pro", monthly: 49.90, annual: 39.90, tax: "7%", features: ["Portfólio Ilimitado", "Destaque nas Buscas", "Agenda Integrada"], popular: true },
  { id: 'premium', name: "Premium", monthly: 99.90, annual: 79.90, tax: "5%", features: ["Selo Verificado", "Suporte Prioritário", "Academy 50% OFF"] },
  { id: 'elite', name: "Elite", monthly: 199.90, annual: 159.90, tax: "2%", features: ["Selo Superstar", "Gerente de Conta", "Visibilidade Máxima"] }
];

const Plans = () => {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);
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

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-12">
      <div className="text-center space-y-6 max-w-2xl mx-auto">
        <Badge className="bg-indigo-100 text-indigo-600 border-none px-4 py-1">Upgrade de Conta</Badge>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">Aumente seus ganhos profissionais</h1>
        
        <div className="flex items-center justify-center gap-4 pt-4">
          <span className={cn("text-sm font-bold", !isAnnual ? "text-slate-900" : "text-slate-400")}>Mensal</span>
          <Switch checked={isAnnual} onCheckedChange={setIsAnnual} className="data-[state=checked]:bg-indigo-600" />
          <span className={cn("text-sm font-bold flex items-center gap-2", isAnnual ? "text-slate-900" : "text-slate-400")}>
            Anual <Badge className="bg-emerald-500 text-white border-none text-[10px]">-20% OFF</Badge>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PRO_PLANS.map((plan: any) => {
          const isCurrent = (profile?.plan_tier || 'free') === plan.id;
          const price = isAnnual ? plan.annual : plan.monthly;
          const chargeAmount = isAnnual ? Number((plan.annual * 12).toFixed(2)) : plan.monthly;

          return (
            <Card key={plan.id} className={cn(
              "p-8 border-none shadow-2xl flex flex-col relative overflow-hidden transition-all",
              plan.popular ? "ring-4 ring-indigo-600 bg-white scale-105 z-10" : "bg-white/80",
              isCurrent && "ring-4 ring-emerald-500"
            )}>
              <div className="mb-8">
                <h3 className="text-xl font-black text-slate-900 mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">R$ {price.toLocaleString('pt-BR')}</span>
                  <span className="text-xs text-slate-400 font-bold">/mês</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl mb-8 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Comissão</p>
                  <p className="text-2xl font-black text-indigo-600">{plan.tax}</p>
                </div>
                <Percent className="w-8 h-8 text-indigo-100" />
              </div>
              
              <div className="space-y-4 flex-1 mb-10">
                {plan.features.map((f: string) => (
                  <div key={f} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> {f}
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => navigate('/app/plans/checkout', { state: { plan: { ...plan, price: chargeAmount }, isAnnual } })} 
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
