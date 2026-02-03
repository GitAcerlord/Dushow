"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Star, Zap, Shield } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "R$ 0",
    description: "Para quem está começando agora.",
    features: ["Perfil básico", "Comissão de 20%", "Até 2 fotos no portfólio", "Suporte via e-mail"],
    buttonText: "Plano Atual",
    variant: "outline",
    icon: Zap
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
    icon: Shield
  },
  {
    name: "Superstar",
    price: "R$ 149,90",
    period: "/mês",
    description: "Para os maiores talentos do mercado.",
    features: ["Selo Superstar", "Comissão mínima (10%)", "Banner no topo da home", "Gestor de conta dedicado", "Acesso antecipado a eventos VIP"],
    buttonText: "Seja Superstar",
    variant: "default",
    icon: Star
  }
];

const ProPlans = () => {
  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-slate-900">Escolha seu nível de sucesso</h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          Aumente sua visibilidade, reduza as taxas de comissão e conquiste mais contratos com nossos planos profissionais.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        {plans.map((plan) => (
          <Card key={plan.name} className={`relative p-8 border-none shadow-lg flex flex-col ${plan.popular ? 'ring-2 ring-indigo-600 scale-105 z-10' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Mais Popular
              </div>
            )}
            
            <div className="mb-8">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${plan.popular ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                <plan.icon className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                {plan.period && <span className="text-slate-500">{plan.period}</span>}
              </div>
              <p className="text-slate-500 mt-2 text-sm">{plan.description}</p>
            </div>

            <div className="space-y-4 flex-1 mb-8">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-start gap-3 text-sm text-slate-600">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <Button 
              variant={plan.variant as any} 
              className={`w-full h-12 text-lg font-bold ${plan.popular ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
              disabled={plan.name === "Free"}
            >
              {plan.buttonText}
            </Button>
          </Card>
        ))}
      </div>

      <div className="mt-16 bg-slate-900 rounded-3xl p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-md">
          <h3 className="text-2xl font-bold mb-2">Dúvidas sobre as comissões?</h3>
          <p className="text-slate-400">
            Nossa taxa de serviço cobre o processamento de pagamentos via ASAAS, segurança jurídica dos contratos e manutenção da plataforma.
          </p>
        </div>
        <Button variant="outline" className="border-white text-white hover:bg-white hover:text-slate-900">
          Ver Termos de Uso
        </Button>
      </div>
    </div>
  );
};

export default ProPlans;