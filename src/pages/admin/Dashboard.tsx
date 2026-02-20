"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign, Activity, Loader2, ArrowUpRight, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { showError } from "@/utils/toast";

type AdminStats = {
  grossRevenue: number;
  platformFee: number;
  userCount: number;
  activeContracts: number;
  pendingApprovals: number;
  newUsersLast24h: number;
};

const statusPaid = ["PAID", "PAGO_ESCROW"];
const statusCompleted = ["COMPLETED", "CONCLUIDO", "LIBERADO_FINANCEIRO"];
const statusPending = ["PENDING", "AGUARDANDO_PAGAMENTO", "PROPOSTO", "CONTRAPROPOSTA"];
type ContractStatRow = { status?: string | null; amount: number };

const fetchContractStats = async (): Promise<ContractStatRow[]> => {
  const modern = await supabase.from("contracts").select("status, valor_atual");
  if (!modern.error) {
    return (modern.data || []).map((row: any) => ({
      status: row.status,
      amount: Number(row.valor_atual || 0),
    }));
  }

  const legacy = await supabase.from("contracts").select("status, value");
  if (!legacy.error) {
    return (legacy.data || []).map((row: any) => ({
      status: row.status,
      amount: Number(row.value || 0),
    }));
  }

  throw modern.error || legacy.error;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [contracts, { data: users, error: usersError }] = await Promise.all([
          fetchContractStats(),
          supabase.from("profiles").select("id, created_at"),
        ]);

        if (usersError) throw usersError;

        const grossRevenue =
          contracts
            ?.filter((contract) => statusPaid.includes(contract.status) || statusCompleted.includes(contract.status))
            .reduce((acc, curr) => acc + Number(curr.amount || 0), 0) || 0;

        const now = Date.now();
        const last24h = 24 * 60 * 60 * 1000;
        const newUsersLast24h =
          users?.filter((user) => user.created_at && now - new Date(user.created_at).getTime() <= last24h).length || 0;

        setStats({
          grossRevenue,
          platformFee: grossRevenue * 0.15,
          userCount: users?.length || 0,
          activeContracts: contracts?.filter((contract) => statusPaid.includes(contract.status)).length || 0,
          pendingApprovals: contracts?.filter((contract) => statusPending.includes(contract.status)).length || 0,
          newUsersLast24h,
        });
      } catch (error: any) {
        console.error("Erro ao carregar estatisticas admin:", error);
        showError(error.message || "Erro ao carregar dados administrativos.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="animate-spin w-10 h-10 text-indigo-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Nao foi possivel carregar os dados administrativos.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Painel de Controle</h1>
          <p className="text-slate-500 mt-1">Dados consolidados em tempo real da plataforma DUSHOW.</p>
        </div>
        <Badge className="bg-emerald-500 text-white px-4 py-1.5 rounded-full">Sistema Online</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Volume Bruto"
          value={`R$ ${stats.grossRevenue.toLocaleString("pt-BR")}`}
          icon={DollarSign}
          tone="indigo"
        />
        <StatCard
          title="Receita Liquida"
          value={`R$ ${stats.platformFee.toLocaleString("pt-BR")}`}
          icon={TrendingUp}
          tone="emerald"
        />
        <StatCard title="Total Usuarios" value={stats.userCount} icon={Users} tone="blue" />
        <StatCard title="Shows Ativos" value={stats.activeContracts} icon={Activity} tone="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8 border-none shadow-sm bg-white">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Alertas de Moderacao
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <span className="text-sm font-bold text-slate-600">Contratos Pendentes</span>
              <span className="text-xl font-black text-indigo-600">{stats.pendingApprovals}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <span className="text-sm font-bold text-slate-600">Novos Usuarios (24h)</span>
              <span className="text-xl font-black text-emerald-600">{stats.newUsersLast24h}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

type StatTone = "indigo" | "emerald" | "blue" | "amber";

const tones: Record<StatTone, { bg: string; icon: string }> = {
  indigo: { bg: "bg-indigo-50", icon: "text-indigo-600" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600" },
  blue: { bg: "bg-blue-50", icon: "text-blue-600" },
  amber: { bg: "bg-amber-50", icon: "text-amber-600" },
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  tone: StatTone;
}) => (
  <Card className="p-6 border-none shadow-sm bg-white hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${tones[tone].bg}`}>
        <Icon className={`w-6 h-6 ${tones[tone].icon}`} />
      </div>
      <ArrowUpRight className="w-4 h-4 text-slate-300" />
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
    <h3 className="text-2xl font-black text-slate-900 mt-1">{value}</h3>
  </Card>
);

export default AdminDashboard;
