"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, DollarSign, Download, Loader2 } from "lucide-react";
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

    const { data } = await supabase
      .from('contracts')
      .select('*, pro:profiles!contracts_pro_id_fkey(full_name)')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });

    setPayments(data || []);
    setLoading(false);
  };

  const totalInvested = payments.reduce((acc, curr) => acc + Number(curr.value), 0);

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Pagamentos</h1>
          <p className="text-slate-500">Histórico de transações e notas fiscais.</p>
        </div>
        <Card className="px-6 py-3 bg-blue-600 text-white border-none shadow-lg rounded-2xl">
          <p className="text-[10px] font-bold uppercase opacity-80">Total Investido</p>
          <p className="text-xl font-black">R$ {totalInvested.toLocaleString('pt-BR')}</p>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden rounded-3xl">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Artista / Evento</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Recibo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <p className="font-bold text-slate-900">{p.pro?.full_name}</p>
                  <p className="text-[10px] text-slate-400 uppercase">{p.event_name}</p>
                </TableCell>
                <TableCell className="font-bold">R$ {Number(p.value).toLocaleString('pt-BR')}</TableCell>
                <TableCell>
                  <Badge className={p.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100'}>
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-500">
                  {new Date(p.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default ClientPayments;