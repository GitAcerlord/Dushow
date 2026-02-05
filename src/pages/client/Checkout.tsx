"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, CreditCard, ArrowLeft, Loader2, Lock, AlertCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from "@/utils/toast";

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState<any>(null);

  const artist = location.state?.artist;
  const contractId = location.state?.contractId;

  useEffect(() => {
    if (!artist || !contractId) {
      navigate('/client/discovery');
      return;
    }
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [artist, contractId, navigate]);

  const handlePayment = async () => {
    if (!user) return;
    setIsProcessing(true);

    try {
      // AUDITORIA: Chamada real ao Gateway via Edge Function
      // Não permitimos mais a criação de contratos 'PAID' via frontend.
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          artistId: artist.id,
          artistName: artist.full_name,
          amount: artist.price,
          clientId: user.id,
          contractId: contractId,
          eventName: `Contratação de ${artist.full_name}`
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Redireciona para o ambiente seguro do Gateway (Stripe/Asaas)
        window.location.href = data.url;
      } else {
        throw new Error("Falha ao gerar link de pagamento.");
      }
    } catch (error: any) {
      console.error("AUDIT_FAIL: Payment Flow Broken", error);
      showError(error.message || "Erro no processamento financeiro.");
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
          <h1 className="text-4xl font-black text-slate-900">Pagamento Seguro</h1>
          <Card className="p-8 border-none shadow-sm bg-white rounded-[2rem] space-y-6">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <ShieldCheck className="text-blue-600 w-5 h-5" />
              <p className="text-sm text-blue-900 font-medium">Ambiente Criptografado</p>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              Seu pagamento será processado e o valor ficará retido em **Escrow** pela DUSHOW. 
              O repasse ao artista só ocorre após a confirmação da realização do evento.
            </p>
          </Card>
        </div>

        <Card className="p-8 border-none shadow-xl bg-white rounded-[2rem] h-fit space-y-6">
          <h3 className="text-xl font-bold">Resumo da Transação</h3>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Artista</span>
              <span className="font-bold">{artist?.full_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Taxa de Garantia</span>
              <span className="text-emerald-600 font-bold">Inclusa</span>
            </div>
            <div className="pt-4 border-t flex justify-between items-end">
              <span className="text-xs font-black text-slate-400 uppercase">Total</span>
              <span className="text-3xl font-black text-indigo-600">R$ {Number(artist?.price).toLocaleString('pt-BR')}</span>
            </div>
          </div>
          <Button 
            onClick={handlePayment} 
            disabled={isProcessing}
            className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 font-black rounded-2xl shadow-2xl shadow-indigo-100"
          >
            {isProcessing ? <Loader2 className="animate-spin" /> : "Ir para Pagamento"}
          </Button>
          <p className="text-[10px] text-center text-slate-400">Ao clicar, você será redirecionado para o checkout seguro.</p>
        </Card>
      </div>
    </div>
  );
};

export default Checkout;