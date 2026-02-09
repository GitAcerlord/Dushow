"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Wallet, TrendingUp, Clock, CreditCard, Loader2, ArrowUpRight, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from '@/integrations/supabase/client';

const ProFinance = () => {
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('financial_ledger')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setLedger(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const totals = {
    previsto: ledger.filter(l => l.status === 'PREVISTO').reduce((acc, curr) => acc + Number(curr.amount), 0),
    confirmado: ledger.filter(l => l.status === 'CONFIRMADO').reduce((acc, curr) => acc + Number(curr.amount), 0),
    recebido: ledger.filter(l => l.status === 'RECEBIDO').reduce((acc, curr) => acc + Number(curr.amount), 0),
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-900">Gestão Financeira</h1>
        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold">
          <Info className="w-4 h-4" /> Taxa da Plataforma: 15%
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-8 bg-slate-50 border-none shadow-sm rounded-[2.5rem]">
          <p className="text-slate-400 text-xs font-black uppercase mb-2">Total Bruto Previsto</p>
          <h3 className="text-3xl font-black text-slate-900">R$ {totals.previsto.toLocaleString('pt-BR')}</h3>
          <p className="text-[10px] text-amber-600 mt-2 font-bold">Valor antes das taxas</p>
        </Card>
        
        <Card className="p-8 bg-indigo-600 text-white border-none shadow-xl rounded-[2.5rem]">
          <p className="text-indigo-200 text-xs font-black uppercase mb-2">Líquido Confirmado</p>
          <h3 className="text-3xl font-black">R$ {(totals.confirmado * 0.85).toLocaleString('pt-BR')}</h3>
          <p className="text-[10px] text-indigo-100 mt-2 font-bold">Já descontados os 15% da DUSHOW</p>
        </Card>

        <Card className="p-8 bg-emerald-600 text-white border-none shadow-xl rounded-[2.5rem]">
          <p className="text-emerald-100 text-xs font-black uppercase mb-2">Total Recebido</p>
          <h3 className="text-3xl font-black">R$ {totals.recebido.toLocaleString('pt-BR')}</h3>
          <p className="text-[10px] text-emerald-100 mt-2 font-bold">Saldo disponível para saque</p>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2rem]">
        <div className="p-6 border-b font-black text-slate-900">Extrato Financeiro Auditável</div>
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Valor Bruto</TableHead>
              <TableHead>Taxa DUSHOW (15%)</TableHead>
              <TableHead>Líquido</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ledger.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-bold">{item.description}</TableCell>
                <TableCell className="text-slate-400 text-xs">R$ {Number(item.amount).toLocaleString('pt-BR')}</TableCell>
                <TableCell className="text-red-400 text-xs">- R$ {(Number(item.amount) * 0.15).toLocaleString('pt-BR')}</TableCell>
                <TableCell className="font-black text-indigo-600">R$ {(Number(item.amount) * 0.85).toLocaleString('pt-BR')}</TableCell>
                <TableCell>
                  <Badge className={
                    item.status === 'RECEBIDO' ? 'bg-emerald-500 text-white' : 
                    item.status === 'CONFIRMADO' ? 'bg-indigo-500 text-white' : 
                    item.status === 'CANCELADO' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                  }>
                    {item.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default ProFinance;