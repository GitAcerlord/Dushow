"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from "@/utils/toast";
import { Button } from "@/components/ui/button";

const AdminContracts = () => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'ADMIN') {
        throw new Error("Acesso negado.");
      }

      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          client:profiles!contracts_client_id_fkey(full_name),
          pro:profiles!contracts_pro_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error: any) {
      showError(error.message || "Erro ao carregar contratos.");
    } finally {
      setLoading(false);
    }
  };

  const resolveDispute = async (contractId: string, resolution: 'PRO' | 'CLIENT') => {
    try {
      const { data, error } = await supabase.functions.invoke('contract-state-machine', {
        body: { contractId, action: 'RESOLVE_DISPUTE', resolution }
      });

      if (error) {
        const errBody = await error.context?.json();
        throw new Error(errBody?.error || error.message);
      }

      // If resolved in favor of client, try to trigger Asaas refund
      if (resolution === 'CLIENT') {
        try {
          const { error: refundErr } = await supabase.functions.invoke('refund-with-asaas', { body: { contractId } } as any);
          if (refundErr) console.error('refund-with-asaas error:', refundErr);
        } catch (e) {
          console.error('Erro ao chamar refund-with-asaas', e);
        }
      }

      showSuccess('Disputa resolvida.');
      fetchContracts();
    } catch (err: any) {
      showError(err.message || 'Erro ao resolver disputa.');
    }
  };

  const totalVolume = contracts.reduce((acc, curr) => acc + Number(curr.value), 0);

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold text-slate-900">Monitoramento Real de Contratos</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-none shadow-sm bg-white">
          <p className="text-sm text-slate-500">Contratos Totais</p>
          <h3 className="text-2xl font-bold">{contracts.length}</h3>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-white">
          <p className="text-sm text-slate-500">Volume Transacionado</p>
          <h3 className="text-2xl font-bold text-emerald-600">R$ {totalVolume.toLocaleString('pt-BR')}</h3>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2rem]">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Artista</TableHead>
                  <TableHead>Contratante</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-500">Nenhum contrato visível ou acesso restrito.</TableCell>
                </TableRow>
              ) : (
                contracts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-bold">{c.event_name}</TableCell>
                    <TableCell>{c.pro?.full_name}</TableCell>
                    <TableCell>{c.client?.full_name}</TableCell>
                    <TableCell>R$ {Number(c.value).toLocaleString('pt-BR')}</TableCell>
                    <TableCell><Badge>{c.status}</Badge></TableCell>
                    <TableCell>
                      {c.status === 'DISPUTED' ? (
                        <div className="flex gap-2">
                          <Button onClick={() => resolveDispute(c.id, 'PRO')} className="bg-emerald-600 text-white" size="sm"><CheckCircle2 className="w-4 h-4" /> Pro</Button>
                          <Button onClick={() => resolveDispute(c.id, 'CLIENT')} className="bg-red-600 text-white" size="sm"><AlertTriangle className="w-4 h-4" /> Cliente</Button>
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default AdminContracts;