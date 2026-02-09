"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, Plus, Trash2, Loader2, ShieldCheck, CheckCircle2, AlertCircle 
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import AddCardDialog from '@/components/payments/AddCardDialog';

const PaymentMethods = () => {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setCards(data || []);
    } catch (error) {
      console.error("Erro ao carregar cartões:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCard = async (id: string) => {
    try {
      const { error } = await supabase.from('payment_methods').delete().eq('id', id);
      if (error) throw error;
      setCards(cards.filter(c => c.id !== id));
      showSuccess("Cartão removido com sucesso.");
    } catch (error) {
      showError("Erro ao remover cartão.");
    }
  };

  const setDefault = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Primeiro remove o default de todos
      await supabase.from('payment_methods').update({ is_default: false }).eq('user_id', user?.id);
      // Define o novo default
      await supabase.from('payment_methods').update({ is_default: true }).eq('id', id);
      
      fetchCards();
      showSuccess("Cartão definido como principal.");
    } catch (error) {
      showError("Erro ao atualizar cartão principal.");
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Métodos de Pagamento</h1>
          <p className="text-slate-500">Gerencie seus cartões para contratações rápidas e seguras.</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Adicionar Cartão
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.length === 0 ? (
          <Card className="col-span-full p-12 text-center border-dashed border-2 bg-slate-50/50 rounded-[2rem] space-y-4">
            <CreditCard className="w-12 h-12 text-slate-200 mx-auto" />
            <p className="text-slate-500 font-medium">Você ainda não possui cartões cadastrados.</p>
          </Card>
        ) : (
          cards.map((card) => (
            <Card key={card.id} className={`p-6 border-none shadow-sm bg-white rounded-[2rem] relative overflow-hidden transition-all ${card.is_default ? 'ring-2 ring-blue-600' : ''}`}>
              <div className="flex justify-between items-start mb-8">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <CreditCard className="w-6 h-6 text-slate-600" />
                </div>
                <div className="flex gap-2">
                  {!card.is_default && (
                    <Button variant="ghost" size="sm" onClick={() => setDefault(card.id)} className="text-[10px] font-bold uppercase text-blue-600 hover:bg-blue-50">
                      Tornar Principal
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => deleteCard(card.id)} className="text-slate-300 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{card.brand}</p>
                <p className="text-xl font-black text-slate-900">•••• •••• •••• {card.last4}</p>
              </div>

              <div className="mt-6 flex justify-between items-center">
                <p className="text-xs font-bold text-slate-500">Validade: {card.exp_month}/{card.exp_year}</p>
                {card.is_default && (
                  <Badge className="bg-blue-600 text-white border-none text-[10px] font-black uppercase">Principal</Badge>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      <Card className="p-6 bg-blue-50 border-none rounded-[2rem] flex gap-4 items-start">
        <ShieldCheck className="text-blue-600 w-6 h-6 shrink-0" />
        <div className="space-y-1">
          <h4 className="font-black text-blue-900 text-sm">Segurança de Dados</h4>
          <p className="text-xs text-blue-700 leading-relaxed">
            A DUSHOW não armazena o número completo do seu cartão ou CVV. Utilizamos tecnologia de tokenização segura para garantir que seus dados financeiros estejam sempre protegidos.
          </p>
        </div>
      </Card>

      <AddCardDialog 
        isOpen={isAddDialogOpen} 
        onClose={() => setIsAddDialogOpen(false)} 
        onSuccess={() => {
          setIsAddDialogOpen(false);
          fetchCards();
        }}
      />
    </div>
  );
};

export default PaymentMethods;