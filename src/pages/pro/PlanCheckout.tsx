"use client";

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, Lock, ShieldCheck, ArrowLeft, Loader2, 
  CheckCircle2, Plus
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from "@/utils/toast";
import AddCardDialog from '@/components/payments/AddCardDialog';
import { cn } from '@/lib/utils';

const PlanCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cards, setCards] = useState<any[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const plan = location.state?.plan;

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('payment_methods').select('*').eq('user_id', user.id);
      setCards(data || []);
      if (data && data.length > 0) setSelectedCardId(data.find(c => c.is_default)?.id || data[0].id);
    }
  };

  if (!plan) {
    return (
      <div className="p-20 text-center">
        <p className="mb-4">Plano não selecionado.</p>
        <Button onClick={() => navigate('/app/plans')}>Voltar</Button>
      </div>
    );
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCardId) return showError("Selecione um cartão.");
    
    setLoading(true);
    try {
      // SECURITY: We now pass the paymentMethodId for server-side verification
      const { data, error } = await supabase.functions.invoke('process-subscription', {
        body: { 
          planId: plan.id,
          paymentMethodId: selectedCardId
        }
      });

      if (error) {
        const errBody = await error.context?.json();
        throw new Error(errBody?.error || error.message);
      }

      setSuccess(true);
      showSuccess(`Parabéns! Você agora é membro ${plan.name}.`);
      
      setTimeout(() => {
        navigate('/app');
      }, 2500);

    } catch (error: any) {
      showError(error.message || "Erro ao processar assinatura.");
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
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-slate-500 font-bold">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8 border-none shadow-xl bg-white rounded-[2.5rem] space-y-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-600 p-3 rounded-2xl text-white">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Pagamento Seguro</h2>
                  <p className="text-sm text-slate-500">Ative seu plano {plan.name}.</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsAddDialogOpen(true)} className="text-indigo-600 font-bold gap-1">
                <Plus className="w-4 h-4" /> Novo Cartão
              </Button>
            </div>

            <div className="grid gap-3">
              {cards.map((card) => (
                <div 
                  key={card.id}
                  onClick={() => setSelectedCardId(card.id)}
                  className={cn(
                    "p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between",
                    selectedCardId === card.id ? "border-indigo-600 bg-indigo-50" : "border-slate-100 bg-white hover:border-slate-200"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <CreditCard className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="font-bold text-slate-900">•••• {card.last4}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-black">{card.brand}</p>
                    </div>
                  </div>
                  {selectedCardId === card.id && <CheckCircle2 className="text-indigo-600 w-5 h-5" />}
                </div>
              ))}
            </div>

            <Button onClick={handlePayment} disabled={loading || !selectedCardId} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-lg font-black rounded-2xl shadow-xl">
              {loading ? <Loader2 className="animate-spin" /> : `Pagar ${plan.price || plan.monthly}`}
            </Button>
          </Card>
        </div>

        <Card className="p-8 border-none shadow-xl bg-slate-900 text-white rounded-[2.5rem] h-fit">
          <h3 className="text-xl font-black mb-4">Resumo</h3>
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-400">Plano</span>
            <Badge className="bg-indigo-600">{plan.name}</Badge>
          </div>
          <div className="pt-4 border-t border-white/10 flex justify-between items-end">
            <span className="font-bold">Total</span>
            <span className="text-3xl font-black text-indigo-400">R$ {(plan.price || plan.monthly).toLocaleString('pt-BR')}</span>
          </div>
          <div className="mt-6 flex items-center gap-2 text-[10px] text-slate-400">
            <Lock className="w-3 h-3" />
            Processamento criptografado via backend seguro.
          </div>
        </Card>
      </div>

      <AddCardDialog isOpen={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} onSuccess={() => { setIsAddDialogOpen(false); fetchCards(); }} />
    </div>
  );
};

export default PlanCheckout;