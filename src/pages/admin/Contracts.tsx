"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, DollarSign, AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from '@/lib/supabase';

const AdminContracts = () => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    try {
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
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
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

      <Card className="border-none shadow-sm bg-white overflow-hidden">
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-bold">{c.event_name}</TableCell>
                  <TableCell>{c.pro?.full_name}</TableCell>
                  <TableCell>{c.client?.full_name}</TableCell>
                  <TableCell>R$ {Number(c.value).toLocaleString('pt-BR')}</TableCell>
                  <TableCell><Badge>{c.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default AdminContracts;