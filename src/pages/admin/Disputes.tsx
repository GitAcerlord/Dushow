"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Loader2, Search, FileText } from 'lucide-react';

const AdminDisputes = () => {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { fetchDisputes(); }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const modern = await supabase
        .from('contracts')
        .select('id, event_name, status, created_at, valor_atual, dispute_reason, disputed_at, contratante_profile_id, profissional_profile_id')
        .in('status', ['DISPUTED', 'EM_MEDIACAO']);

      let rows: any[] = [];
      let getClientId: (row: any) => string | null = () => null;
      let getProId: (row: any) => string | null = () => null;
      let getAmount: (row: any) => number = () => 0;
      let getOpenedAt: (row: any) => string | null = () => null;

      if (!modern.error) {
        rows = modern.data || [];
        getClientId = (row) => row.contratante_profile_id || null;
        getProId = (row) => row.profissional_profile_id || null;
        getAmount = (row) => Number(row.valor_atual || 0);
        getOpenedAt = (row) => row.disputed_at || row.created_at || null;
      } else {
        const legacy = await supabase
          .from('contracts')
          .select('id, event_name, status, created_at, value, dispute_reason, dispute_opened_at, client_id, pro_id')
          .in('status', ['DISPUTED', 'EM_MEDIACAO']);

        if (!legacy.error) {
          rows = legacy.data || [];
          getClientId = (row) => row.client_id || null;
          getProId = (row) => row.pro_id || null;
          getAmount = (row) => Number(row.value || 0);
          getOpenedAt = (row) => row.dispute_opened_at || row.created_at || null;
        } else {
          const minimal = await supabase
            .from('contracts')
            .select('id, event_name, status, created_at, client_id, pro_id')
            .in('status', ['DISPUTED', 'EM_MEDIACAO']);

          if (minimal.error) throw minimal.error;
          rows = minimal.data || [];
          getClientId = (row) => row.client_id || null;
          getProId = (row) => row.pro_id || null;
          getAmount = () => 0;
          getOpenedAt = (row) => row.created_at || null;
        }
      }

      const profileIds = Array.from(
        new Set(
          rows.flatMap((row) => {
            const ids = [getClientId(row), getProId(row)].filter(Boolean);
            return ids as string[];
          }),
        ),
      );
      const { data: profiles } = profileIds.length
        ? await supabase.from('profiles').select('id, full_name').in('id', profileIds)
        : { data: [] as any[] };
      const profileMap = new Map((profiles || []).map((profile: any) => [profile.id, profile.full_name || '-']));

      const normalized = rows
        .map((row) => ({
          ...row,
          value: getAmount(row),
          dispute_opened_at: getOpenedAt(row),
          client: { full_name: profileMap.get(getClientId(row) || '') || '-' },
          pro: { full_name: profileMap.get(getProId(row) || '') || '-' },
        }))
        .sort((a, b) => {
          const aTime = a.dispute_opened_at ? new Date(a.dispute_opened_at).getTime() : 0;
          const bTime = b.dispute_opened_at ? new Date(b.dispute_opened_at).getTime() : 0;
          return bTime - aTime;
        });

      setDisputes(normalized);
    } catch (e: any) {
      showError(e.message || 'Erro ao buscar disputas');
    } finally {
      setLoading(false);
    }
  };

  const filtered = disputes.filter(d =>
    d.event_name?.toLowerCase().includes(filter.toLowerCase()) ||
    d.client?.full_name?.toLowerCase().includes(filter.toLowerCase()) ||
    d.pro?.full_name?.toLowerCase().includes(filter.toLowerCase())
  );

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black">Disputas em Andamento</h1>
          <p className="text-slate-500">Lista de contratos com disputas abertas para revisão administrativa.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Filtrar por evento, cliente ou artista" value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-sm" />
          <Button onClick={fetchDisputes} className="bg-indigo-600 text-white"><Search className="w-4 h-4" /></Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Pro</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Abrir em</TableHead>
                <TableHead>Logs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => (
                <React.Fragment key={d.id}>
                  <TableRow>
                    <TableCell className="font-bold">{d.event_name}</TableCell>
                    <TableCell>{d.pro?.full_name}</TableCell>
                    <TableCell>{d.client?.full_name}</TableCell>
                    <TableCell>R$ {Number(d.value).toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-xs text-slate-500">{d.dispute_opened_at ? new Date(d.dispute_opened_at).toLocaleString() : '—'}</TableCell>
                    <TableCell>
                      <Button onClick={() => toggleExpand(d.id)} variant="outline" size="sm"><FileText className="w-4 h-4" /> Logs</Button>
                    </TableCell>
                  </TableRow>
                  {expanded[d.id] && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-slate-50">
                        <div className="p-4">
                          <p className="text-sm font-bold">Motivo:</p>
                          <p className="text-sm mb-3">{d.dispute_reason || 'Não informado'}</p>
                          <div>
                            <h4 className="font-black text-sm mb-2">Entradas do Ledger (últimas 10)</h4>
                            <Ledger contractId={d.id} />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}

const Ledger = ({ contractId }: { contractId: string }) => {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('financial_ledger').select('*').eq('contract_id', contractId).order('created_at', { ascending: false }).limit(10);
      setRows(data || []);
    })();
  }, [contractId]);

  if (rows.length === 0) return <div className="text-sm text-slate-500">Nenhuma entrada encontrada.</div>

  return (
    <div className="grid gap-2">
      {rows.map(r => (
        <div key={r.id} className="flex justify-between text-sm">
          <div className="text-slate-700">{r.description}</div>
          <div className={r.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'}>{r.type === 'CREDIT' ? '+' : '-'} R$ {Math.abs(Number(r.amount)).toLocaleString('pt-BR')}</div>
        </div>
      ))}
    </div>
  )
}

export default AdminDisputes;
