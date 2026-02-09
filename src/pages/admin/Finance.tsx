"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, CreditCard, Download, Wallet, Percent, ArrowRightLeft, Loader2
} from "lucide-react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { supabase } from '@/integrations/supabase/client';
import { Badge } from "@/components/ui/badge";

const AdminFinance = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ gross: 0, commission: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*, pro:profiles!contracts_pro_id_fkey(full_name, plan_tier)')
        .in('status', ['PAID', 'COMPLETED'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const gross = data.reduce((acc, curr) => acc + Number(curr.value), 0);
        // Cálculo simplificado de comissão (média 15%)
        const commission = gross * 0.15;
        const pending = data.filter(c => c.status === 'PAID').reduce((acc, curr) => acc + Number(curr.value), 0);

        setStats({ gross, commission, pending });
        setTransactions(data);
      }
    } catch (e) {
      console.error("Erro financeiro:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Gestão Financeira Global</h1>
          <p className="text-slate-500 mt-1">Monitoramento de transações reais processadas pela plataforma.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 rounded-xl">
          <Download className="w-4 h-4" /> Exportar Relatório
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-none shadow-sm bg-white">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Volume Bruto Total</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">R$ {stats.gross.toLocaleString('pt-BR')}</h3>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-indigo-600 text-white">
          <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Comissão Estimada (15%)</p>
          <h3 className="text-3xl font-black mt-1">R$ {stats.commission.toLocaleString('pt-BR')}</h3>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-white">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retido em Escrow</p>
          <h3 className="text-3xl font-black text-emerald-600 mt-1">R$ {stats.pending.toLocaleString('pt-BR')}</h3>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2.5rem]">
        <div className="p-6 border-b">
          <h3 className="font-black text-slate-900">Histórico de Transações</h3>
        </div>
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead>Artista</TableHead>
              <TableHead>Valor Bruto</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-slate-400">Nenhuma transação financeira registrada.</TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-bold">{tx.event_name}</TableCell>
                  <TableCell>{tx.pro?.full_name}</TableCell>
                  <TableCell className="font-black text-indigo-600">R$ {Number(tx.value).toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge className={tx.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500'}>
                      {tx.status === 'PAID' ? 'EM ESCROW' : 'FINALIZADO'}
                    </Badge>
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

export default AdminFinance;