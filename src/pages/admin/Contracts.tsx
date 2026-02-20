"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Button } from "@/components/ui/button";

type AdminContract = {
  id: string;
  event_name?: string | null;
  amount?: number | null;
  status: string;
  client_name?: string | null;
  pro_name?: string | null;
};

const AdminContracts = () => {
  const [contracts, setContracts] = useState<AdminContract[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const modern = await supabase
        .from("contracts")
        .select("id, event_name, status, created_at, valor_atual, contratante_profile_id, profissional_profile_id")
        .order("created_at", { ascending: false });

      let rows: any[] = [];
      let getClientId: (row: any) => string | null = () => null;
      let getProId: (row: any) => string | null = () => null;
      let getAmount: (row: any) => number = () => 0;

      if (!modern.error) {
        rows = modern.data || [];
        getClientId = (row) => row.contratante_profile_id || null;
        getProId = (row) => row.profissional_profile_id || null;
        getAmount = (row) => Number(row.valor_atual || 0);
      } else {
        const legacy = await supabase
          .from("contracts")
          .select("id, event_name, status, created_at, value, client_id, pro_id")
          .order("created_at", { ascending: false });

        if (legacy.error) throw legacy.error;
        rows = legacy.data || [];
        getClientId = (row) => row.client_id || null;
        getProId = (row) => row.pro_id || null;
        getAmount = (row) => Number(row.value || 0);
      }

      const profileIds = Array.from(
        new Set(
          rows.flatMap((row) => {
            const ids = [getClientId(row), getProId(row)].filter(Boolean);
            return ids as string[];
          }),
        ),
      );

      let profileMap = new Map<string, string>();
      if (profileIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", profileIds);
        profileMap = new Map((profiles || []).map((profile: any) => [profile.id, profile.full_name || "-"]));
      }

      setContracts(
        rows.map((row) => ({
          id: row.id,
          event_name: row.event_name,
          status: row.status,
          amount: getAmount(row),
          client_name: profileMap.get(getClientId(row) || "") || "-",
          pro_name: profileMap.get(getProId(row) || "") || "-",
        })),
      );
    } catch (error: any) {
      showError(error.message || "Erro ao carregar contratos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const resolveDispute = async (contractId: string, resolution: "PRO" | "CLIENT") => {
    try {
      const { data, error } = await supabase.functions.invoke("contract-state-machine", {
        body: { contractId, action: "RESOLVE_DISPUTE", resolution },
      });

      if (error) {
        const errBody = await error.context?.json();
        throw new Error(errBody?.error || error.message);
      }

      if (!data) throw new Error("Resposta inesperada ao resolver disputa.");

      if (resolution === "CLIENT") {
        try {
          const { error: refundErr } = await supabase.functions.invoke("refund-with-asaas", { body: { contractId } } as any);
          if (refundErr) console.error("refund-with-asaas error:", refundErr);
        } catch (e) {
          console.error("Erro ao chamar refund-with-asaas", e);
        }
      }

      showSuccess("Disputa resolvida.");
      fetchContracts();
    } catch (err: any) {
      showError(err.message || "Erro ao resolver disputa.");
    }
  };

  const totalVolume = contracts.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold text-slate-900">Monitoramento de Contratos</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-none shadow-sm bg-white">
          <p className="text-sm text-slate-500">Contratos Totais</p>
          <h3 className="text-2xl font-bold">{contracts.length}</h3>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-white">
          <p className="text-sm text-slate-500">Volume Transacionado</p>
          <h3 className="text-2xl font-bold text-emerald-600">R$ {totalVolume.toLocaleString("pt-BR")}</h3>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2rem]">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Artista</TableHead>
                <TableHead>Contratante</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                    Nenhum contrato visivel.
                  </TableCell>
                </TableRow>
              ) : (
                contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-bold">{contract.event_name || "Sem nome"}</TableCell>
                    <TableCell>{contract.pro_name || "-"}</TableCell>
                    <TableCell>{contract.client_name || "-"}</TableCell>
                    <TableCell>R$ {Number(contract.amount || 0).toLocaleString("pt-BR")}</TableCell>
                    <TableCell>
                      <Badge>{contract.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {contract.status === "DISPUTED" ? (
                        <div className="flex gap-2">
                          <Button onClick={() => resolveDispute(contract.id, "PRO")} className="bg-emerald-600 text-white" size="sm">
                            <CheckCircle2 className="w-4 h-4" /> Pro
                          </Button>
                          <Button onClick={() => resolveDispute(contract.id, "CLIENT")} className="bg-red-600 text-white" size="sm">
                            <AlertTriangle className="w-4 h-4" /> Cliente
                          </Button>
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
