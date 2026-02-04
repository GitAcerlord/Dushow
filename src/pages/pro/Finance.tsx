"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { 
  Wallet, TrendingUp, Clock, Percent, Download, Loader2, ShieldCheck
} from "lucide-react";
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

      const { data: contractsData, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('pro_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(contractsData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const totalGross = contracts.filter(c => c.status === 'PAID' || c.status === 'COMPLETED').reduce((acc, curr) => acc + Number(curr.value), 0);
  const pending = contracts.filter(c => c.status === 'PENDING').reduce((acc, curr) => acc + Number(curr.value), 0);
  
  // Cálculo de comissão baseado no plano (simulado por enquanto, mas usando dados reais de valor)
  const commissionRate = profile?.is_superstar ? 0.10 : profile?.is_verified ? 0.15 : 0.20;
  const netEarnings = totalGross * (1 - commissionRate);

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>;

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold text-slate-900">Financeiro Real</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-none shadow-lg bg-indigo-600 text-white">
          <p className="text-indigo-100 text-sm font-medium mb-1">Saldo Líquido Estimado</p>
          <h3 className="text-3xl font-black">R$ {netEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <Button onClick={() => showSuccess("Saque solicitado!")} className="w-full mt-4 bg-white text-indigo-600 hover:bg-indigo-50 font-bold">Solicitar Saque</Button>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="p-2 bg-emerald-50 rounded-lg w-fit mb-4"><TrendingUp className="w-6 h-6 text-emerald-600" /></div>
          <p className="text-slate-500 text-sm font-medium">Volume Bruto Pago</p>
          <h3 className="text-2xl font-bold text-slate-900">R$ {totalGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="p-2 bg-amber-50 rounded-lg w-fit mb-4"><Clock className="w-6 h-6 text-amber-600" /></div>
          <p className="text-slate-500 text-sm font-medium">Aguardando Pagamento</p>
          <h3 className="text-2xl font-bold text-slate-900">R$ {pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead>Valor Bruto</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="font-bold">{tx.event_name}</TableCell>
                <TableCell>R$ {Number(tx.value).toLocaleString('pt-BR')}</TableCell>
                <TableCell><Badge>{tx.status}</Badge></TableCell>
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