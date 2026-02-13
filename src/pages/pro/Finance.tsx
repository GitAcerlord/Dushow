"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  Send, 
  Landmark, 
  Activity, 
  Download,
  Percent,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const ProFinance = () => {
  const [profile, setProfile] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getCommissionLabel = (plan?: string) => {
    switch ((plan || 'free').toLowerCase()) {
      case 'pro': return '7%';
      case 'elite': return '5%';
      case 'superstar': return '2%';
      default: return '10%';
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // 1. Perfil com saldos
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(profileData);

      // 2. Extrato (Ledger)
      const { data: ledgerData } = await supabase
        .from('financial_ledger')
        .select('*, contracts(event_name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setLedger(ledgerData || []);
    }
    setLoading(false);
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (amount > (profile?.balance_available || 0)) return showError("Saldo disponível insuficiente.");
    if (amount < 50) return showError("Valor mínimo de saque: R$ 50,00");

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('withdrawals').insert({
        user_id: profile.id,
        amount: amount,
        pix_key: pixKey,
        status: 'PENDING'
      });

      if (error) throw error;

      showSuccess("Solicitação de saque enviada com sucesso!");
      setWithdrawAmount("");
      setPixKey("");
      fetchData();
    } catch (e: any) {
      showError("Falha ao processar saque.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-[#2D1B69]" /></div>;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#2D1B69]">Minha Carteira</h1>
          <p className="text-slate-500">Gestão de recebimentos e split de taxas da plataforma.</p>
        </div>
        <Button variant="outline" className="rounded-xl gap-2 border-slate-200">
          <Download className="w-4 h-4" /> Relatório Fiscal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Saldo em Escrow */}
        <Card className="p-6 border-none shadow-sm bg-slate-50 rounded-[2.5rem] space-y-4">
          <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
            <Clock className="w-4 h-4" /> Saldo em Escrow (Bloqueado)
          </div>
          <h3 className="text-3xl font-black text-slate-400">R$ {Number(profile?.balance_pending || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <p className="text-[10px] text-slate-400 leading-tight">Valores garantidos são liberados após confirmação do evento ou 24h após a data_evento.</p>
        </Card>

        {/* Saldo Disponível */}
        <Card className="p-6 border-none shadow-2xl bg-[#2D1B69] text-white rounded-[2.5rem] space-y-6 md:col-span-2">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-200 font-bold uppercase text-[10px] tracking-widest">
                <CheckCircle2 className="w-4 h-4" /> Valor Disponível para Saque
              </div>
              <h3 className="text-5xl font-black">R$ {Number(profile?.balance_available || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-[#FFB703] text-[#2D1B69] hover:bg-[#e6a600] rounded-2xl font-black px-8 h-14 shadow-xl">
                  Sacar via PIX
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black text-[#2D1B69]">Solicitar Transferência</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Valor (R$)</Label>
                    <Input 
                      type="number" 
                      placeholder="0,00" 
                      value={withdrawAmount} 
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="h-12 bg-slate-50 border-none rounded-xl font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Chave PIX</Label>
                    <Input 
                      placeholder="CPF, Celular ou E-mail" 
                      value={pixKey} 
                      onChange={(e) => setPixKey(e.target.value)}
                      className="h-12 bg-slate-50 border-none rounded-xl"
                    />
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl flex gap-3 items-center">
                    <Landmark className="w-5 h-5 text-blue-600" />
                    <p className="text-[10px] text-blue-700 font-medium">A transferência será processada para sua conta em até 2 dias úteis.</p>
                  </div>
                  <Button 
                    onClick={handleWithdraw} 
                    disabled={isSubmitting || !withdrawAmount || !pixKey}
                    className="w-full h-14 bg-[#2D1B69] rounded-2xl font-black"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirmar Saque"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="pt-4 border-t border-white/10 flex items-center gap-2">
            <Percent className="w-4 h-4 text-[#FFB703]" />
            <p className="text-[10px] text-indigo-200 font-bold uppercase">Taxa da Plataforma: {getCommissionLabel(profile?.plan_tier)} (conforme seu plano).</p>
          </div>
        </Card>
      </div>

      {/* Extrato Detalhado */}
      <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2.5rem]">
        <div className="p-6 border-b bg-slate-50/50 flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#2D1B69]" />
          <h3 className="font-black text-[#2D1B69]">Histórico de Movimentações</h3>
        </div>
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ledger.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-20 text-slate-400">Nenhuma transação registrada ainda.</TableCell>
              </TableRow>
            ) : (
              ledger.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <p className="font-bold text-slate-900">{entry.description}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black">{entry.contracts?.event_name || 'Geral'}</p>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {new Date(entry.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "text-[8px] font-black uppercase px-2",
                      entry.type === 'CREDIT' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    )}>
                      {entry.type === 'CREDIT' ? 'Crédito' : 'Débito'}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-black",
                    entry.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'
                  )}>
                    {entry.type === 'CREDIT' ? '+' : '-'} R$ {Math.abs(Number(entry.amount)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default ProFinance;
