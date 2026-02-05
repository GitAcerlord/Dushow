"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Wallet, TrendingUp, Clock, CreditCard, Loader2, ExternalLink, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from "@/utils/toast";

const ProFinance = () => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(profileData);

      const { data: contractsData } = await supabase
        .from('contracts')
        .select('*')
        .eq('pro_id', user.id)
        .order('created_at', { ascending: false });

      setContracts(contractsData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // REGRA DE NEGÓCIO: Escrow Real
  // Saldo Disponível = Apenas contratos COMPLETED
  // Saldo Retido = Contratos PAID (aguardando evento)
  const availableBalance = contracts
    .filter(c => c.status === 'COMPLETED')
    .reduce((acc, curr) => acc + Number(curr.value), 0);

  const pendingBalance = contracts
    .filter(c => c.status === 'PAID')
    .reduce((acc, curr) => acc + Number(curr.value), 0);

  const commissionRate = profile?.plan_tier === 'elite' ? 0.02 : 
                         profile?.plan_tier === 'premium' ? 0.07 : 
                         profile?.plan_tier === 'pro' ? 0.10 : 0.15;

  const netBalance = availableBalance * (1 - commissionRate);

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-900">Gestão Financeira</h1>
        <Badge className="bg-indigo-600 px-4 py-1.5">Taxa do Plano: {commissionRate * 100}%</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-8 bg-slate-900 text-white border-none shadow-2xl rounded-[2.5rem]">
          <p className="text-slate-400 text-xs font-black uppercase mb-2">Saldo Disponível (Líquido)</p>
          <h3 className="text-4xl font-black">R$ {netBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <Button className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 font-bold h-12 rounded-xl">Solicitar Saque</Button>
        </Card>
        
        <Card className="p-8 bg-white border-none shadow-sm rounded-[2.5rem]">
          <div className="p-3 bg-amber-50 rounded-xl w-fit mb-4"><Clock className="text-amber-600" /></div>
          <p className="text-slate-500 text-xs font-black uppercase">Saldo Retido (Escrow)</p>
          <h3 className="text-2xl font-black text-slate-900">R$ {pendingBalance.toLocaleString('pt-BR')}</h3>
          <p className="text-[10px] text-slate-400 mt-2">Liberado após a conclusão do evento.</p>
        </Card>

        <Card className="p-8 bg-white border-none shadow-sm rounded-[2.5rem]">
          <div className="p-3 bg-emerald-50 rounded-xl w-fit mb-4"><TrendingUp className="text-emerald-600" /></div>
          <p className="text-slate-500 text-xs font-black uppercase">Volume Total Bruto</p>
          <h3 className="text-2xl font-black text-slate-900">R$ {(availableBalance + pendingBalance).toLocaleString('pt-BR')}</h3>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2rem]">
        <div className="p-6 border-b font-black text-slate-900">Ledger de Transações</div>
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead>Valor Bruto</TableHead>
              <TableHead>Status Financeiro</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="font-bold">{tx.event_name}</TableCell>
                <TableCell>R$ {Number(tx.value).toLocaleString('pt-BR')}</TableCell>
                <TableCell>
                  <Badge className={cn(
                    "uppercase text-[10px]",
                    tx.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 
                    tx.status === 'PAID' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100'
                  )}>
                    {tx.status === 'COMPLETED' ? 'Disponível' : tx.status === 'PAID' ? 'Retido' : 'Pendente'}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default ProFinance;