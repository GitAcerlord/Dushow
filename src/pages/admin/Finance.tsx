"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Activity } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { showError, showSuccess } from "@/utils/toast";

type LedgerEntry = {
  id: string;
  amount?: number | null;
  type?: string | null;
  created_at?: string | null;
  user_id?: string | null;
  contract_id?: string | null;
  profiles?: { full_name?: string | null } | null;
  contracts?: { event_name?: string | null; status?: string | null } | null;
};

const paidStatus = ["PAID", "PAGO_ESCROW"];
const completedStatus = ["COMPLETED", "CONCLUIDO", "LIBERADO_FINANCEIRO"];

const fetchContractAmounts = async (): Promise<Array<{ status?: string | null; amount: number }>> => {
  const modern = await supabase.from("contracts").select("status, valor_atual");
  if (!modern.error) {
    return (modern.data || []).map((row: any) => ({ status: row.status, amount: Number(row.valor_atual || 0) }));
  }

  const legacy = await supabase.from("contracts").select("status, value");
  if (!legacy.error) {
    return (legacy.data || []).map((row: any) => ({ status: row.status, amount: Number(row.value || 0) }));
  }

  throw modern.error || legacy.error;
};

const AdminFinance = () => {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [stats, setStats] = useState({ totalVolume: 0, platformRevenue: 0, activeEscrow: 0 });
  const [loading, setLoading] = useState(true);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const [ledgerWithUserId, contracts] = await Promise.all([
        supabase.from("financial_ledger").select("id, amount, type, created_at, user_id, contract_id").order("created_at", { ascending: false }),
        fetchContractAmounts(),
      ]);

      let ledgerRows: any[] = [];
      let getUserId: (row: any) => string | null = () => null;
      if (!ledgerWithUserId.error) {
        ledgerRows = ledgerWithUserId.data || [];
        getUserId = (row) => row.user_id || null;
      } else {
        const ledgerWithProfileId = await supabase
          .from("financial_ledger")
          .select("id, amount, type, created_at, profile_id, contract_id")
          .order("created_at", { ascending: false });
        if (ledgerWithProfileId.error) throw ledgerWithProfileId.error;
        ledgerRows = ledgerWithProfileId.data || [];
        getUserId = (row) => row.profile_id || null;
      }

      const totalVolume =
        contracts
          ?.filter((contract) => paidStatus.includes(contract.status) || completedStatus.includes(contract.status))
          .reduce((acc, curr) => acc + Number(curr.amount || 0), 0) || 0;

      const activeEscrow =
        contracts
          ?.filter((contract) => paidStatus.includes(contract.status))
          .reduce((acc, curr) => acc + Number(curr.amount || 0), 0) || 0;

      const profileIds = Array.from(new Set(ledgerRows.map((row) => getUserId(row)).filter(Boolean))) as string[];
      const contractIds = Array.from(new Set(ledgerRows.map((row) => row.contract_id).filter(Boolean))) as string[];

      const [{ data: profiles }, { data: contractRows }] = await Promise.all([
        profileIds.length ? supabase.from("profiles").select("id, full_name").in("id", profileIds) : Promise.resolve({ data: [] as any[] }),
        contractIds.length ? supabase.from("contracts").select("id, event_name, status").in("id", contractIds) : Promise.resolve({ data: [] as any[] }),
      ]);

      const profileMap = new Map((profiles || []).map((profile: any) => [profile.id, profile]));
      const contractMap = new Map((contractRows || []).map((contract: any) => [contract.id, contract]));

      setStats({
        totalVolume,
        platformRevenue: totalVolume * 0.15,
        activeEscrow,
      });
      setLedger(
        ledgerRows.map((row) => ({
          id: row.id,
          amount: row.amount,
          type: row.type,
          created_at: row.created_at,
          user_id: getUserId(row),
          contract_id: row.contract_id || null,
          profiles: profileMap.get(getUserId(row) || "") || null,
          contracts: contractMap.get(row.contract_id || "") || null,
        })),
      );
    } catch (error: any) {
      console.error("Erro financeiro:", error);
      showError(error.message || "Falha ao carregar dados financeiros.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const csvRows = useMemo(() => {
    return ledger.map((entry) => ({
      usuario: entry.profiles?.full_name || "",
      evento: entry.contracts?.event_name || "",
      tipo: entry.type || "",
      valor: String(entry.amount ?? 0),
      data: entry.created_at ? new Date(entry.created_at).toISOString() : "",
    }));
  }, [ledger]);

  const exportLedger = () => {
    if (csvRows.length === 0) {
      showError("Nao ha dados para exportar.");
      return;
    }

    const headers = ["usuario", "evento", "tipo", "valor", "data"];
    const content = [
      headers.join(","),
      ...csvRows.map((row) =>
        headers
          .map((header) => {
            const raw = String(row[header as keyof typeof row] ?? "");
            const escaped = raw.replaceAll('"', '""');
            return `"${escaped}"`;
          })
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.setAttribute("download", `ledger-admin-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    showSuccess("Ledger exportado com sucesso.");
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Fluxo de Caixa Real</h1>
          <p className="text-slate-500 mt-1">Monitoramento de cada transacao processada no sistema.</p>
        </div>
        <Button onClick={exportLedger} className="bg-indigo-600 hover:bg-indigo-700 gap-2 rounded-xl">
          <Download className="w-4 h-4" /> Exportar Ledger
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-none shadow-sm bg-white">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Volume Transacionado</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">R$ {stats.totalVolume.toLocaleString("pt-BR")}</h3>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-indigo-600 text-white">
          <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Receita da Plataforma</p>
          <h3 className="text-3xl font-black mt-1">R$ {stats.platformRevenue.toLocaleString("pt-BR")}</h3>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-emerald-50 border border-emerald-100">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Garantia (Escrow Ativo)</p>
          <h3 className="text-3xl font-black text-emerald-700 mt-1">R$ {stats.activeEscrow.toLocaleString("pt-BR")}</h3>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2.5rem]">
        <div className="p-6 border-b flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" />
          <h3 className="font-black text-slate-900">Historico de Movimentacoes (Ledger)</h3>
        </div>
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ledger.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-slate-400">
                  Nenhuma movimentacao financeira registrada.
                </TableCell>
              </TableRow>
            ) : (
              ledger.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-bold">{entry.profiles?.full_name || "-"}</TableCell>
                  <TableCell className="text-xs text-slate-500">{entry.contracts?.event_name || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "text-[8px] font-black uppercase",
                        entry.type === "CREDIT" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700",
                      )}
                    >
                      {entry.type === "CREDIT" ? "Credito" : "Debito"}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn("font-black", entry.type === "CREDIT" ? "text-emerald-600" : "text-red-600")}>
                    {entry.type === "CREDIT" ? "+" : "-"} R$ {Math.abs(Number(entry.amount || 0)).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-[10px] text-slate-400">
                    {entry.created_at ? new Date(entry.created_at).toLocaleString() : "-"}
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
