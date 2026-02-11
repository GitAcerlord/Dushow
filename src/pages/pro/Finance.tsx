"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Wallet, ArrowUpRight, Clock, CheckCircle2, Loader2, Send, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

const ProFinance = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
    }
    setLoading(false);
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (amount > profile.balance_available) return showError("Saldo insuficiente.");
    if (amount < 10) return showError("Valor mínimo de saque: R$ 10,00");

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('withdrawals').insert({
        user_id: profile.id,
        amount: amount,
        pix_key: pixKey,
        pix_key_type: 'RANDOM', // Simplificado
        status: 'PENDING'
      });

      if (error) throw error;

      // Deduzir do saldo disponível imediatamente (UI)
      await supabase.from('profiles').update({ 
        balance_available: profile.balance_available - amount 
      }).eq('id', profile.id);

      // Inserir lançamento no ledger para auditar a solicitação de saque
      await supabase.from('financial_ledger').insert({
        user_id: profile.id,
        amount: -amount,
        type: 'DEBIT',
        description: `Solicitação de saque - PIX: ${pixKey}`
      });

      showSuccess("Solicitação de saque enviada! Prazo: 24h úteis.");
      fetchData();
    } catch (e) {
      showError("Erro ao solicitar saque.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Movimentações do usuário (ledger)
  const [movements, setMovements] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from('financial_ledger')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      setMovements(data || []);
    })();
  }, [profile]);

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-black text-slate-900">Minha Carteira</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-8 border-none shadow-sm bg-slate-50 rounded-[2.5rem] space-y-4">
          <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
            <Clock className="w-4 h-4" /> Saldo em Escrow (Pendente)
          </div>
          <h3 className="text-4xl font-black text-slate-400">R$ {Number(profile.balance_pending || 0).toLocaleString('pt-BR')}</h3>
          <p className="text-xs text-slate-400">Liberado após a confirmação do contratante.</p>
        </Card>

        <Card className="p-8 border-none shadow-2xl bg-indigo-600 text-white rounded-[2.5rem] space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-200 font-bold uppercase text-[10px] tracking-widest">
              <CheckCircle2 className="w-4 h-4" /> Saldo Disponível
            </div>
            <h3 className="text-5xl font-black">R$ {Number(profile.balance_available || 0).toLocaleString('pt-BR')}</h3>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full h-14 bg-white text-indigo-600 hover:bg-indigo-50 rounded-2xl font-black text-lg gap-2">
                <Send className="w-5 h-5" /> Solicitar Saque PIX
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">Saque via PIX</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Valor do Saque</Label>
                  <Input 
                    type="number" 
                    placeholder="0,00" 
                    value={withdrawAmount} 
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="h-12 bg-slate-50 border-none rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Chave PIX</Label>
                  <Input 
                    placeholder="CPF, E-mail ou Chave Aleatória" 
                    value={pixKey} 
                    onChange={(e) => setPixKey(e.target.value)}
                    className="h-12 bg-slate-50 border-none rounded-xl"
                  />
                </div>
                <Button 
                  onClick={handleWithdraw} 
                  disabled={isSubmitting || !withdrawAmount || !pixKey}
                  className="w-full h-14 bg-indigo-600 rounded-2xl font-black"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirmar Saque"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </Card>
      </div>
      <Card className="p-6 border-none shadow-sm bg-white rounded-[2.5rem]">
        <h3 className="text-lg font-black mb-4">Minhas Movimentações</h3>
        {movements.length === 0 ? (
          <div className="text-sm text-slate-400">Nenhuma movimentação encontrada.</div>
        ) : (
          <div className="grid gap-3">
            {movements.map((m) => (
              <div key={m.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-100">
                <div>
                  <div className="text-sm font-bold">{m.description}</div>
                  <div className="text-[12px] text-slate-400">{new Date(m.created_at).toLocaleString()}</div>
                </div>
                <div className={m.type === 'CREDIT' ? 'text-emerald-600 font-black' : 'text-red-600 font-black'}>
                  {m.type === 'CREDIT' ? '+' : '-'} R$ {Math.abs(Number(m.amount)).toLocaleString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProFinance;