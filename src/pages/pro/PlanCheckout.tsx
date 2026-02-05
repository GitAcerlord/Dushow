"use client";

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CreditCard, Lock, ShieldCheck, ArrowLeft, Loader2, 
  CheckCircle2, Sparkles, Calendar
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from "@/utils/toast";

const PlanCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const plan = location.state?.plan;

  if (!plan) {
    return <div className="p-20 text-center">Plano não selecionado.</div>;
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Simulação de processamento de gateway (Stripe/Asaas)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { error } = await supabase.from('profiles').update({ 
        plan_tier: plan.id,
        is_verified: ['premium', 'elite'].includes(plan.id),
        is_superstar: plan.id === 'elite'
      }).eq('id', user.id);

      if (error) throw error;

      setSuccess(true);
      showSuccess(`Parabéns! Você agora é membro ${plan.name}.`);
      
      setTimeout(() => {
        navigate('/pro');
      }, 3000);

    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <Card className="max-w-md w-full p-12 text-center space-y-6 border-none shadow-2xl rounded-[3rem] bg-white">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-900">Assinatura Ativa!</h2>
          <p className="text-slate-500">Seu perfil foi atualizado e seus novos benefícios já estão liberados.</p>
          <div className="pt-6">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
            <p className="text-xs text-slate-400 mt-2">Redirecionando para o painel...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-slate-500 font-bold">
        <ArrowLeft className="w-4 h-4" /> Voltar para Planos
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8 border-none shadow-xl bg-white rounded-[2.5rem] space-y-8">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-600 p-3 rounded-2xl text-white">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Método de Pagamento</h2>
                <p className="text-sm text-slate-500">Vincule seu cartão para ativar o plano {plan.name}.</p>
              </div>
            </div>

            <form onSubmit={handlePayment} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-400">Número do Cartão</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                    <Input placeholder="0000 0000 0000 0000" className="h-14 pl-12 bg-slate-50 border-none rounded-2xl" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-400">Validade</Label>
                    <Input placeholder="MM/AA" className="h-14 bg-slate-50 border-none rounded-2xl" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-400">CVV</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                      <Input placeholder="123" className="h-14 pl-12 bg-slate-50 border-none rounded-2xl" required />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-400">Nome no Cartão</Label>
                  <Input placeholder="Como impresso no cartão" className="h-14 bg-slate-50 border-none rounded-2xl" required />
                </div>
              </div>

              <div className="p-4 bg-indigo-50 rounded-2xl flex items-center gap-3 border border-indigo-100">
                <ShieldCheck className="text-indigo-600 w-5 h-5" />
                <p className="text-xs text-indigo-900 font-medium">Seus dados estão protegidos por criptografia de ponta a ponta.</p>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-lg font-black rounded-2xl shadow-2xl shadow-indigo-100">
                {loading ? <Loader2 className="animate-spin" /> : `Ativar Plano ${plan.name}`}
              </Button>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-8 border-none shadow-xl bg-slate-900 text-white rounded-[2.5rem] space-y-6">
            <h3 className="text-xl font-black">Resumo da Assinatura</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Plano Selecionado</span>
                <Badge className="bg-indigo-600 border-none">{plan.name}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Ciclo de Cobrança</span>
                <span className="text-sm font-bold">Mensal</span>
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                <span className="text-sm font-bold">Total Hoje</span>
                <span className="text-3xl font-black text-indigo-400">{plan.price}</span>
              </div>
            </div>

            <div className="space-y-3 pt-6">
              <p className="text-[10px] font-black text-slate-500 uppercase">Benefícios Imediatos</p>
              {plan.features.slice(0, 3).map((f: string) => (
                <div key={f} className="flex items-center gap-2 text-xs text-slate-300">
                  <Sparkles className="w-3 h-3 text-indigo-400" /> {f}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PlanCheckout;