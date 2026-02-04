"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, CreditCard, ArrowLeft, Loader2, Lock } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showError } from "@/utils/toast";

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState<any>(null);

  const artist = location.state?.artist;

  useEffect(() => {
    if (!artist) {
      navigate('/client/discovery');
      return;
    }
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [artist, navigate]);

  const handlePayment = async () => {
    if (!user) {
      showError("Sessão expirada. Faça login novamente.");
      return;
    }

    setIsProcessing(true);
    try {
      // Chamada real para a Edge Function do Stripe
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          artistId: artist.id,
          artistName: artist.full_name,
          amount: artist.price,
          clientId: user.id,
          eventName: `Show com ${artist.full_name}`
        }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url; // Redireciona para o Stripe real
      }
    } catch (error: any) {
      console.error("Erro no Checkout:", error);
      showError("Falha ao iniciar pagamento. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 font-bold text-sm">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <h1 className="text-4xl font-black text-slate-900">Finalizar Contratação</h1>
          <Card className="p-8 border-none shadow-sm bg-white rounded-[2rem] space-y-6">
            <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <ShieldCheck className="text-indigo-600 w-5 h-5" />
              <p className="text-sm text-indigo-900 font-medium">Pagamento processado via **Stripe** com garantia de Escrow DUSHOW.</p>
            </div>
            <div className="space-y-4">
              <p className="text-slate-600 text-sm">
                Ao clicar em pagar, você será redirecionado para o ambiente seguro do Stripe para concluir a transação.
              </p>
            </div>
          </Card>
        </div>

        <Card className="p-8 border-none shadow-xl bg-white rounded-[2rem] h-fit space-y-6">
          <h3 className="text-xl font-bold">Resumo do Pedido</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Profissional</span><span className="font-bold">{artist?.full_name}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Cachê</span><span className="font-bold">R$ {Number(artist?.price).toLocaleString('pt-BR')}</span></div>
            <div className="pt-4 border-t flex justify-between items-end">
              <span className="text-xs font-bold text-slate-400 uppercase">Total a Pagar</span>
              <span className="text-2xl font-black text-indigo-600">R$ {Number(artist?.price).toLocaleString('pt-BR')}</span>
            </div>
          </div>
          <Button 
            onClick={handlePayment} 
            disabled={isProcessing}
            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 font-black rounded-xl shadow-lg shadow-indigo-100"
          >
            {isProcessing ? <Loader2 className="animate-spin" /> : "Ir para Pagamento Seguro"}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Checkout;