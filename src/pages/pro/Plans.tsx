"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Star, Zap, Shield, ArrowRight } from "lucide-react";
import { showSuccess } from "@/utils/toast";

const plans = [
  {
    name: "Free",
    price: "R$ 0",
    description: "Para quem está começando agora.",
    features: ["Perfil básico", "Comissão de 20%", "Até 2 fotos no portfólio", "Suporte via e-mail"],
    buttonText: "Plano Atual",
    variant: "outline",
    icon: Zap,
    color: "text-slate-400",
    bg: "bg-slate-50"
  },
  {
    name: "Pro",
    price: "R$ 49,90",
    period: "/mês",
    description: "Ideal para profissionais ativos.",
    features: ["Selo Verificado", "Comissão reduzida (15%)", "Portfólio ilimitado", "Destaque nas buscas", "Suporte prioritário"],
    buttonText: "Fazer Upgrade",
    variant: "default",
    popular: true,
    icon: Shield,
    color: "text-indigo-600",
    bg: "bg-indigo-50"
  },
  {
    name: "Superstar",
    price: "R$ 149,90",
    period: "/mês",
    description: "Para os maiores talentos do mercado.",
    features: ["Selo Superstar", "Comissão mínima (10%)", "Banner no topo da home", "Gestor de conta dedicado", "Acesso antecipado a eventos VIP"],
    buttonText: "Seja Superstar",
    variant: "default",
    icon: Star,
    color: "text-amber-500",
    bg: "bg-amber-50"
  }
];

const ProPlans = () => {
  const handleUpgrade = (planName: string) => {
    showSuccess(`Iniciando upgrade para o plano ${planName}. Você será redirecionado para o pagamento.`);
  };

  return (
    <div className="p-8 space-y-12 max-w-6xl mx-auto">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider">
          <Star className="w-3 h-3 fill-current" />
          Cresça com a DUSHOW
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Escolha seu nível de sucesso</h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          Aumente sua visibilidade, reduza as taxas de comissão e conquiste mais contratos com nossos planos profissionais.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        {plans.map((plan) => (
          <Card key={plan.name} className={`relative p-8 border-none shadow-xl flex flex-col transition-all duration-300 hover:translate-y-[-8px] ${plan.popular ? 'ring-2 ring-indigo-600 scale-105 z-10 bg-white' : 'bg-white/80'}`}>
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                Mais Popular
              </div>
            )}
            
            <div className="mb-8">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${plan.bg} ${plan.color}`}>
                <plan.icon className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                {plan.period && <span className="text-slate-500 font-medium">{plan.period}</span>}
              </div>
              <p className="text-slate-500 mt-3 text-sm leading-relaxed">{plan.description}</p>
            </div>

            <div className="space-y-4 flex-1 mb-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">O que está incluso:</p>
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-start gap-3 text-sm text-slate-600">
                  <div className="mt-0.5 bg-emerald-100 rounded-full p-0.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="font-medium">{feature}</span>
                </div>
              ))}
            </div>

            <Button 
              variant={plan.variant as any} 
              onClick={() => handleUpgrade(plan.name)}
              className={`w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-all ${
                plan.popular 
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' 
                  : 'hover:bg-slate-900 hover:text-white'
              }`}
              disabled={plan.name === "Free"}
            >
              {plan.buttonText}
              {plan.name !== "Free" && <ArrowRight className="ml-2 w-5 h-5" />}
            </Button>
          </Card>
        ))}
      </div>

      {/* Commission Comparison */}
      <Card className="p-8 border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-md space-y-2">
            <h3 className="text-2xl font-bold">Por que fazer o upgrade?</h3>
            <p className="text-slate-400 text-sm">
              Nossa taxa de serviço cobre o processamento de pagamentos via ASAAS, segurança jurídica dos contratos e manutenção da plataforma. Ao subir de plano, você retém uma fatia maior do seu cachê.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Free</p>
              <p className="text-2xl font-black">20%</p>
              <p className="text-[8px] text-slate-500">Taxa</p>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-2xl border border-indigo-500/30 scale-110">
              <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Pro</p>
              <p className="text-2xl font-black">15%</p>
              <p className="text-[8px] text-slate-500">Taxa</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Superstar</p>
              <p className="text-2xl font-black">10%</p>
              <p className="text-[8px] text-slate-500">Taxa</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProPlans;