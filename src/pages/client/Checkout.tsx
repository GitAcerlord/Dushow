"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, CreditCard, ArrowLeft, Loader2, Lock, CheckCircle2, Plus 
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from "@/utils/toast";
import AddCardDialog from '@/components/payments/AddCardDialog';
import { cn } from '@/lib/utils';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingCards, setLoadingCards] = useState(true);
  const [cards, setCards] = useState<any[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const artist = location.state?.artist;
  const contractId = location.state?.contractId;

  useEffect(() => {
    if (!artist || !contractId) {
      navigate('/client/discovery');
      return;
    }
    fetchSavedCards();
  }, [artist, contractId, navigate]);

  const fetchSavedCards = async () => {
    setLoadingCards(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id);

      setCards(data || []);
      if (data && data.length > 0) {
        const defaultCard = data.find(c => c.is_default) || data[0];
        setSelectedCardId(defaultCard.id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingCards(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedCardId) {
      showError("Selecione ou adicione um cartão para continuar.");
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-payment', {
        body: {
          contractId: contractId,
          paymentMethodId: selectedCardId
        }
      });

      if (error) throw error;

      showSuccess("Pagamento aprovado! O valor está seguro em Escrow.");
      navigate('/client/payments');
    } catch (error: any) {
      showError(error.message || "Erro no processamento via Asaas.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 font-bold text-sm">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <h1 className="text-4xl font-black text-slate-900">Finalizar Contratação</h1>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900">Escolha o Cartão</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsAddDialogOpen(true)} className="text-blue-600 font-bold gap-1">
                <Plus className="w-4 h-4" /> Novo Cartão
              </Button>
            </div>

            {loadingCards ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600" /></div>
            ) : cards.length === 0 ? (
              <Card className="p-8 text-center border-dashed border-2 bg-slate-50/50 rounded-[2rem]" onClick={() => setIsAddDialogOpen(true)}>
                <p className="text-slate-500 font-medium cursor-pointer">Clique para adicionar seu primeiro cartão.</p>
              </Card>
            ) : (
              <div className="grid gap-3">
                {cards.map((card) => (
                  <div 
                    key={card.id}
                    onClick={() => setSelectedCardId(card.id)}
                    className={cn(
                      "p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between",
                      selectedCardId === card.id ? "border-blue-600 bg-blue-50" : "border-slate-100 bg-white hover:border-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <CreditCard className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">•••• {card.last4}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black">{card.brand}</p>
                      </div>
                    </div>
                    {selectedCardId === card.id && <CheckCircle2 className="text-blue-600 w-5 h-5" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Card className="p-6 border-none bg-emerald-50 rounded-[2rem] flex gap-4 items-start">
            <ShieldCheck className="text-emerald-600 w-6 h-6 shrink-0" />
            <div className="space-y-1">
              <h4 className="font-black text-emerald-900 text-sm">Garantia DUSHOW & Asaas</h4>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Seu pagamento fica retido com segurança. O artista só recebe após a realização do evento e sua confirmação final.
              </p>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-8 border-none shadow-xl bg-white rounded-[2.5rem] h-fit space-y-6">
            <h3 className="text-xl font-black">Resumo</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Artista</span>
                <span className="font-bold">{artist?.full_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Taxa de Serviço</span>
                <span className="text-emerald-600 font-bold">Inclusa</span>
              </div>
              <div className="pt-4 border-t flex justify-between items-end">
                <span className="text-xs font-black text-slate-400 uppercase">Total</span>
                <span className="text-3xl font-black text-blue-600">R$ {Number(artist?.price).toLocaleString('pt-BR')}</span>
              </div>
            </div>
            <Button 
              onClick={handlePayment} 
              disabled={isProcessing || !selectedCardId}
              className="w-full h-16 bg-blue-600 hover:bg-blue-700 font-black rounded-2xl shadow-2xl shadow-blue-100"
            >
              {isProcessing ? <Loader2 className="animate-spin" /> : "Confirmar e Pagar"}
            </Button>
            <div className="flex items-center gap-2 text-[10px] text-center text-slate-400 justify-center">
              <Lock className="w-3 h-3" /> Pagamento Processado via Asaas
            </div>
          </Card>
        </div>
      </div>

      <AddCardDialog 
        isOpen={isAddDialogOpen} 
        onClose={() => setIsAddDialogOpen(false)} 
        onSuccess={() => {
          setIsAddDialogOpen(false);
          fetchSavedCards();
        }}
      />
    </div>
  );
};

export default Checkout;