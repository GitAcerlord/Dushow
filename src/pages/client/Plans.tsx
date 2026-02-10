"use client";

import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Zap, ShieldCheck, Star, Loader2, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

const CLIENT_PLANS = [
  { 
    id: 'free', 
    name: "Básico", 
    monthly: 0, 
    annual: 0, 
    features: ["Até 3 propostas/mês", "Contratos Digitais", "Suporte via E-mail"] 
  },
  { 
    id: 'plus', 
    name: "Plus", 
    monthly: 29.90, 
    annual: 23.90, 
    popular: true,
    features: ["Propostas Ilimitadas", "Selo de Bom Pagador", "Suporte Prioritário", "Taxa de Serviço -2%"] 
  },
  { 
    id: 'business', 
    name: "Business", 
    monthly: 89.90, 
    annual: 71.90, 
    features: ["Gestão de Múltiplos Eventos", "Concierge DUSHOW", "Faturamento via Boleto/PIX", "Seguro Cancelamento"] 
  }
];

const ClientPlans = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <Badge className="bg-blue-100 text-blue-600 border-none px-4 py-1">Upgrade de Conta</Badge>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">Mais economia para seus eventos</h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">Escolha o plano ideal para o volume de contratações da sua empresa ou evento.</p>
        
        <div className="flex items-center justify-center gap-4 pt-6">
          <span className={cn("text-sm font-bold", !isAnnual ? "text-slate-900" : "text-slate-400")}>Mensal</span>
          <Switch checked={isAnnual} onCheckedChange={setIsAnnual} className="data-[state=checked]:bg-blue-600" />
          <span className={cn("text-sm font-bold flex items-center gap-2", isAnnual ? "text-slate-900" : "text-slate-400")}>
            Anual <Badge className="bg-emerald-500 text-white border-none text-[10px]">-20% DE ECONOMIA</Badge>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {CLIENT_PLANS.map((plan) => {
          const price = isAnnual ? plan.annual : plan.monthly;
          return (
            <Card key={plan.id} className={cn(
              "p-8 border-none shadow-xl flex flex-col relative overflow-hidden transition-all",
              plan.popular ? "ring-4 ring-blue-600 bg-white scale-105 z-10" : "bg-white/80"
            )}>
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 rounded-bl-xl text-[10px] font-black uppercase">
                  Mais Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-black text-slate-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">R$ {price.toLocaleString('pt-BR')}</span>
                  <span className="text-xs text-slate-400 font-bold">/mês</span>
                </div>
                {isAnnual && plan.monthly > 0 && (
                  <p className="text-[10px] text-emerald-600 font-black mt-1 uppercase">Economize R$ {(plan.monthly - plan.annual).toFixed(2)} por mês</p>
                )}
              </div>

              <div className="space-y-4 flex-1 mb-10">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                    <Check className="w-5 h-5 text-emerald-500 shrink-0" /> {f}
                  </div>
                ))}
              </div>

              <Button className={cn(
                "w-full h-14 rounded-2xl font-black text-lg shadow-lg transition-all",
                plan.id === 'free' ? "bg-slate-100 text-slate-400 cursor-default" : "bg-blue-600 hover:bg-blue-700"
              )}>
                {plan.id === 'free' ? "Plano Atual" : "Fazer Upgrade"}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ClientPlans;