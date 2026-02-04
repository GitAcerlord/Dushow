"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ShieldCheck, CreditCard, QrCode, ArrowLeft, CheckCircle2, Loader2, Lock } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from "@/utils/toast";

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);

  const artist = location.state?.artist || { id: 'mock', full_name: "Artista Exemplo", price: 500 };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleStripePayment = async () => {
    if (!user) {
      showError("Faça login para contratar.");
      return;
    }

    setIsProcessing(true);
    try {
      // Simulação de chamada para Stripe API
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Criar contrato no banco após "sucesso" no Stripe
      const { error } = await supabase.from('contracts').insert({
        client_id: user.id,
        pro_id: artist.id,
        event_name: `Show com ${artist.full_name}`,
        event_date: new Date(Date.now() + 604800000).toISOString(),
        value: artist.price,
        status: 'PAID',
        payment_method: 'STRIPE_CARD'
      });

      if (error) throw error;

      setIsSuccess(true);
      showSuccess("Pagamento processado via Stripe!");
    } catch (error: any) {
      showError("Erro no processamento do pagamento.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
        <Card className="max-w-md w-full p-12 text-center space-y-6 border-none shadow-2xl bg-white rounded-[2.5rem]">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900">Sucesso!</h2>
          <p className="text-slate-500">Seu pagamento foi confirmado pelo Stripe e o contrato já está disponível.</p>
          <Button className="w-full bg-indigo-600 h-12 rounded-xl font-bold" onClick={() => navigate('/client/discovery')}>
            Voltar para Início
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 font-bold text-sm">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <h1 className="text-4xl font-black text-slate-900">Pagamento Seguro</h1>
          
          <Card className="p-8 border-none shadow-sm bg-white rounded-[2rem] space-y-6">
            <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <Lock className="text-indigo-600 w-5 h-5" />
              <p className="text-sm text-indigo-900 font-medium">Seus dados são processados de forma criptografada pelo **Stripe**.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Número do Cartão</Label>
                <Input placeholder="0000 0000 0000 0000" className="h-12 bg-slate-50 border-none rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Validade</Label>
                  <Input placeholder="MM/AA" className="h-12 bg-slate-50 border-none rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>CVC</Label>
                  <Input placeholder="123" className="h-12 bg-slate-50 border-none rounded-xl" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-8 border-none shadow-xl bg-white rounded-[2rem] h-fit space-y-6">
          <h3 className="text-xl font-bold">Resumo do Show</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Artista</span><span className="font-bold">{artist.full_name}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Cachê</span><span className="font-bold">R$ {Number(artist.price).toLocaleString('pt-BR')}</span></div>
            <div className="pt-4 border-t flex justify-between items-end">
              <span className="text-xs font-bold text-slate-400 uppercase">Total</span>
              <span className="text-2xl font-black text-indigo-600">R$ {Number(artist.price).toLocaleString('pt-BR')}</span>
            </div>
          </div>
          <Button 
            onClick={handleStripePayment} 
            disabled={isProcessing}
            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 font-black rounded-xl shadow-lg shadow-indigo-100"
          >
            {isProcessing ? <Loader2 className="animate-spin" /> : "Pagar com Stripe"}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Checkout;