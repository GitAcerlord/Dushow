"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, Download, Loader2, ArrowUpRight, ArrowDownRight, Activity
} from "lucide-react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { supabase } from '@/integrations/supabase/client';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const AdminFinance = () => {
  const [ledger, setLedger] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalVolume: 0, platformRevenue: 0, activeEscrow: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      // Busca todas as movimentações do Ledger
      const { data: ledgerData, error: ledgerError } = await supabase
        .from('financial_ledger')
        .select('*, profiles(full_name), contracts(event_name, status)')
        .order('created_at', { ascending: false });

      if (ledgerError) throw ledgerError;

      // Busca contratos para estatísticas de volume
      const { data: contracts } = await supabase
        .from('contracts')
        .select('value, status')
        .in('status', ['PAID', 'COMPLETED']);

      if (contracts) {
        const totalVolume = contracts.reduce((acc, curr) => acc + Number(curr.value), 0);
        const platformRevenue = totalVolume * 0.15; // Média
        const activeEscrow = contracts.filter(c => c.status === 'PAID').reduce((acc, curr) => acc + Number(curr.value), 0);
        
        setStats({ totalVolume, platformRevenue, activeEscrow });
      }

      setLedger(ledgerData || []);
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
          <h1 className="text-3xl font-black text-slate-900">Fluxo de Caixa Real</h1>
          <p className="text-slate-500 mt-1">Monitoramento de cada transação processada no sistema.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 rounded-xl">
          <Download className="w-4 h-4" /> Exportar Ledger
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-none shadow-sm bg-white">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Volume Transacionado</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">R$ {stats.totalVolume.toLocaleString('pt-BR')}</h3>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-indigo-600 text-white">
          <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Receita da Plataforma</p>
          <h3 className="text-3xl font-black mt-1">R$ {stats.platformRevenue.toLocaleString('pt-BR')}</h3>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-emerald-50 border border-emerald-100">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Garantia (Escrow Ativo)</p>
          <h3 className="text-3xl font-black text-emerald-700 mt-1">R$ {stats.activeEscrow.toLocaleString('pt-BR')}</h3>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2.5rem]">
        <div className="p-6 border-b flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" />
          <h3 className="font-black text-slate-900">Histórico de Movimentações (Ledger)</h3>
        </div>
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ledger.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-slate-400">Nenhuma movimentação financeira registrada.</TableCell>
              </TableRow>
            ) : (
              ledger.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-bold">{entry.profiles?.full_name}</TableCell>
                  <TableCell className="text-xs text-slate-500">{entry.contracts?.event_name}</TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "text-[8px] font-black uppercase",
                      entry.type === 'CREDIT' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    )}>
                      {entry.type === 'CREDIT' ? 'Crédito' : 'Débito'}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn(
                    "font-black",
                    entry.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'
                  )}>
                    {entry.type === 'CREDIT' ? '+' : '-'} R$ {Math.abs(Number(entry.amount)).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-[10px] text-slate-400">
                    {new Date(entry.created_at).toLocaleString()}
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