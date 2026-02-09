"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, DollarSign, Download, Loader2, ShieldCheck, Info } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from '@/integrations/supabase/client';

const ClientPayments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Filtro: Apenas contratos que geraram movimentação financeira real (PAID ou COMPLETED)
    const { data } = await supabase
      .from('contracts')
      .select('*, pro:profiles!contracts_pro_id_fkey(full_name)')
      .eq('client_id', user.id)
      .in('status', ['PAID', 'COMPLETED'])
      .order('created_at', { ascending: false });

    setPayments(data || []);
    setLoading(false);
  };

  const totalInvested = payments.reduce((acc, curr) => acc + Number(curr.value), 0);

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Financeiro</h1>
          <p className="text-slate-500">Histórico de transações reais e proteção de saldo.</p>
        </div>
        <Card className="px-6 py-4 bg-blue-600 text-white border-none shadow-xl rounded-2xl flex items-center gap-4">
          <div className="p-2 bg-white/10 rounded-lg">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase opacity-80">Total Transacionado</p>
            <p className="text-2xl font-black">R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </Card>
      </div>

      {/* Informativo de Escrow */}
      <Card className="p-6 border-none bg-emerald-50 border border-emerald-100 rounded-[2rem] flex gap-4 items-start">
        <div className="p-3 bg-white rounded-2xl shadow-sm">
          <ShieldCheck className="text-emerald-600 w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="font-black text-emerald-900">Seu dinheiro está seguro</h4>
          <p className="text-sm text-emerald-700 leading-relaxed">
            A DUSHOW utiliza um sistema de <strong>Escrow</strong>. Quando você paga, o valor fica retido em nossa conta de garantia. 
            O repasse ao artista só é realizado após a data do evento e sua confirmação de que tudo ocorreu conforme o contrato.
          </p>
        </div>
      </Card>

      <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2.5rem]">
        <div className="p-6 border-b bg-slate-50/50">
          <h3 className="font-bold text-slate-900">Extrato de Pagamentos</h3>
        </div>
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Artista / Evento</TableHead>
              <TableHead>Valor Pago</TableHead>
              <TableHead>Status Financeiro</TableHead>
              <TableHead>Data do Pagamento</TableHead>
              <TableHead className="text-right">Recibo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-slate-400">
                  Nenhum pagamento realizado ainda.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p) => (
                <TableRow key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <p className="font-bold text-slate-900">{p.pro?.full_name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">{p.event_name}</p>
                  </TableCell>
                  <TableCell className="font-black text-blue-600">
                    R$ {Number(p.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "font-bold text-[10px] uppercase px-3 py-1 rounded-full",
                      p.status === 'PAID' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    )}>
                      {p.status === 'PAID' ? 'Retido em Escrow' : 'Repassado ao Artista'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 font-medium">
                    {new Date(p.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <button className="p-2 hover:bg-blue-50 rounded-xl text-blue-600 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center gap-2 text-slate-400 justify-center text-xs font-medium">
        <Info className="w-4 h-4" />
        Pagamentos processados via Gateway Seguro com Split de Comissões.
      </div>
    </div>
  );
};

export default ClientPayments;