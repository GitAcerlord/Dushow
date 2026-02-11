"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Clock, CheckCircle2, Loader2, Send, AlertTriangle, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

type FinanceMovement = {
  id: string;
  type: 'INCOME' | 'WITHDRAWAL';
  amount: number;
  created_at: string;
  status: string;
  description: string;
  asaasReference?: string;
};

const ProFinance = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [movements, setMovements] = useState<FinanceMovement[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(profileData);

    const [{ data: withdrawalsData }, { data: contractsData }] = await Promise.all([
      supabase
        .from('withdrawals')
        .select('id, amount, status, created_at, asaas_wallet_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('contracts')
        .select('id, value, status, updated_at')
        .eq('pro_id', user.id)
        .in('status', ['RELEASED', 'COMPLETED'])
        .order('updated_at', { ascending: false })
        .limit(50)
    ]);

    const withdrawalMovements: FinanceMovement[] = (withdrawalsData || []).map((w: any) => ({
      id: `withdrawal-${w.id}`,
      type: 'WITHDRAWAL',
      amount: Number(w.amount || 0),
      created_at: w.created_at,
      status: w.status || 'PENDING',
      description: 'Solicitação de saque via PIX',
      asaasReference: w.asaas_wallet_id || profileData?.asaas_wallet_id || undefined
    }));

    const incomeMovements: FinanceMovement[] = (contractsData || []).map((c: any) => ({
      id: `contract-${c.id}`,
      type: 'INCOME',
      amount: Number(c.value || 0),
      created_at: c.updated_at || new Date().toISOString(),
      status: c.status,
      description: `Repasse confirmado do contrato #${String(c.id).slice(0, 8)}`,
      asaasReference: profileData?.asaas_wallet_id || undefined
    }));

    setMovements([...withdrawalMovements, ...incomeMovements].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)));
    setLoading(false);
  };

  const pendingWithdrawals = useMemo(() => movements.filter((m) => m.type === 'WITHDRAWAL' && m.status === 'PENDING').length, [movements]);

  const handleWithdraw = async () => {
    if (!profile?.asaas_wallet_id) {
      return showError('Configure o Wallet ID do Asaas no seu perfil antes de solicitar saque.');
    }

    const amount = parseFloat(withdrawAmount);
    if (!amount || Number.isNaN(amount)) return showError("Informe um valor válido.");
    if (amount > Number(profile.balance_available || 0)) return showError("Saldo insuficiente.");
    if (amount < 10) return showError("Valor mínimo de saque: R$ 10,00");
    if (!pixKey.trim()) return showError("Informe a chave PIX.");

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('withdrawals').insert({
        user_id: profile.id,
        amount,
        pix_key: pixKey.trim(),
        pix_key_type: 'RANDOM',
        status: 'PENDING',
        asaas_wallet_id: profile.asaas_wallet_id,
      });

      if (error) throw error;

      await supabase.from('profiles').update({
        balance_available: Number(profile.balance_available || 0) - amount
      }).eq('id', profile.id);

      setWithdrawAmount("");
      setPixKey("");
      showSuccess("Solicitação de saque enviada com vínculo ao Asaas. Prazo: 24h úteis.");
      fetchData();
    } catch (e) {
      showError("Erro ao solicitar saque. Confira os dados financeiros e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatus = (status: string) => {
    const normalized = (status || '').toUpperCase();
    if (["DONE", "RELEASED", "COMPLETED", "APPROVED"].includes(normalized)) return <Badge className="bg-emerald-100 text-emerald-700 border-none">Concluído</Badge>;
    if (["FAILED", "REJECTED", "CANCELLED"].includes(normalized)) return <Badge className="bg-red-100 text-red-700 border-none">Falhou</Badge>;
    return <Badge className="bg-amber-100 text-amber-700 border-none">Pendente</Badge>;
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-black text-slate-900">Minha Carteira</h1>

      {!profile?.asaas_wallet_id && (
        <Card className="p-4 bg-amber-50 border-amber-200 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-bold text-amber-700">Wallet ID do Asaas pendente</p>
            <p className="text-sm text-amber-700/90">Para receber repasses e saques sem erro, configure seu Wallet ID no Meu Perfil.</p>
          </div>
        </Card>
      )}

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
            <p className="text-xs text-indigo-100">Wallet Asaas vinculado: {profile.asaas_wallet_id ? 'Sim' : 'Não'}</p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full h-14 bg-white text-indigo-600 hover:bg-indigo-50 rounded-2xl font-black text-lg gap-2" disabled={!profile?.asaas_wallet_id}>
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
                  disabled={isSubmitting || !withdrawAmount || !pixKey || !profile?.asaas_wallet_id}
                  className="w-full h-14 bg-indigo-600 rounded-2xl font-black"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirmar Saque"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </Card>
      </div>

      <Card className="p-6 rounded-3xl border-none shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Movimentações financeiras</h2>
            <p className="text-sm text-slate-500">Listagem individual de entradas e saques.</p>
          </div>
          <Badge variant="secondary" className="font-bold">{pendingWithdrawals} saque(s) pendente(s)</Badge>
        </div>

        <div className="space-y-3">
          {movements.length === 0 ? (
            <p className="text-slate-500 text-sm">Nenhuma movimentação encontrada.</p>
          ) : (
            movements.map((movement) => (
              <div key={movement.id} className="border border-slate-100 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${movement.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {movement.type === 'INCOME' ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{movement.description}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {new Date(movement.created_at).toLocaleString('pt-BR')} · Asaas: {movement.asaasReference || 'não vinculado'}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-black ${movement.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {movement.type === 'INCOME' ? '+' : '-'} R$ {movement.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="mt-1 flex justify-end">{renderStatus(movement.status)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default ProFinance;
