"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Wallet, TrendingUp, Clock, CreditCard, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from '@/lib/supabase';
import { showSuccess } from "@/utils/toast";

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

  const totalGross = contracts.filter(c => c.status === 'PAID').reduce((acc, curr) => acc + Number(curr.value), 0);
  const commission = profile?.is_superstar ? 0.10 : 0.15;
  const net = totalGross * (1 - commission);

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Financeiro</h1>
        <Button variant="outline" className="gap-2 border-indigo-100 text-indigo-600">
          <ExternalLink className="w-4 h-4" /> Ver no ASAAS
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-8 bg-indigo-600 text-white border-none shadow-xl">
          <p className="text-indigo-100 text-sm font-bold uppercase mb-2">Saldo Disponível</p>
          <h3 className="text-4xl font-black">R$ {net.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <Button className="w-full mt-6 bg-white text-indigo-600 hover:bg-indigo-50 font-bold h-12">Solicitar Saque</Button>
        </Card>
        
        <Card className="p-6 bg-white border-none shadow-sm">
          <div className="p-3 bg-emerald-50 rounded-xl w-fit mb-4"><TrendingUp className="text-emerald-600" /></div>
          <p className="text-slate-500 text-sm font-bold">Volume Bruto</p>
          <h3 className="text-2xl font-black text-slate-900">R$ {totalGross.toLocaleString('pt-BR')}</h3>
        </Card>

        <Card className="p-6 bg-white border-none shadow-sm">
          <div className="p-3 bg-amber-50 rounded-xl w-fit mb-4"><Clock className="text-amber-600" /></div>
          <p className="text-slate-500 text-sm font-bold">Taxa de Serviço ({commission * 100}%)</p>
          <h3 className="text-2xl font-black text-slate-900">R$ {(totalGross * commission).toLocaleString('pt-BR')}</h3>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <div className="p-6 border-b font-bold">Histórico de Transações</div>
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="font-bold">{tx.event_name}</TableCell>
                <TableCell>R$ {Number(tx.value).toLocaleString('pt-BR')}</TableCell>
                <TableCell><Badge className={tx.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100'}>{tx.status}</Badge></TableCell>
                <TableCell>{new Date(tx.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default ProFinance;