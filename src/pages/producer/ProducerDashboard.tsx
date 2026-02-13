"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Ticket, Users, TrendingUp, DollarSign, Share2, QrCode, BarChart3, Loader2, Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

const ProducerDashboard = () => {
  const [stats, setStats] = useState({
    tickets_sold: 0,
    gross_revenue: 0,
    conversion_rate: 0,
    active_events: 0,
    escrow_balance: 0,
    released_balance: 0,
  });
  const [events, setEvents] = useState<any[]>([]);
  const [eligibleContracts, setEligibleContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openActivate, setOpenActivate] = useState(false);
  const [form, setForm] = useState({
    contractId: "",
    nome: "",
    descricao: "",
    dataInicio: "",
    dataFim: "",
    local: "",
    capacidade: "500",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [statsRes, eventsRes, contractsRes, linkedEventsRes] = await Promise.all([
        supabase.rpc("get_producer_dashboard_stats", { p_producer_id: user.id }),
        supabase
          .from("producer_events_metrics")
          .select("*")
          .eq("producer_profile_id", user.id)
          .order("data_inicio", { ascending: true }),
        supabase
          .from("contracts")
          .select("id, event_name, data_evento, local, event_location, status, status_master")
          .eq("contratante_profile_id", user.id)
          .in("status_master", ["AGUARDANDO_PAGAMENTO", "PAGO_ESCROW", "EM_EXECUCAO", "CONCLUIDO", "LIBERADO_FINANCEIRO"]),
        supabase
          .from("producer_events")
          .select("contract_id")
          .eq("producer_profile_id", user.id),
      ]);

      if (statsRes.error) throw statsRes.error;
      if (eventsRes.error) throw eventsRes.error;
      if (contractsRes.error) throw contractsRes.error;
      if (linkedEventsRes.error) throw linkedEventsRes.error;

      setStats(statsRes.data || stats);
      setEvents(eventsRes.data || []);

      const linkedIds = new Set((linkedEventsRes.data || []).map((e: any) => e.contract_id));
      const freeContracts = (contractsRes.data || []).filter((c: any) => !linkedIds.has(c.id));
      setEligibleContracts(freeContracts);
    } catch (e: any) {
      showError(e.message || "Falha ao carregar painel do produtor.");
    } finally {
      setLoading(false);
    }
  };

  const activateTicketing = async () => {
    if (!form.contractId || !form.nome || !form.dataInicio || !form.dataFim || !form.local) {
      return showError("Preencha os campos obrigatorios.");
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("producer-activate-ticketing", {
        body: {
          contractId: form.contractId,
          nome: form.nome,
          descricao: form.descricao,
          dataInicio: form.dataInicio,
          dataFim: form.dataFim,
          local: form.local,
          capacidade: Number(form.capacidade || 0),
        },
      });
      if (error) throw error;
      showSuccess("Bilheteria ativada com sucesso.");
      setOpenActivate(false);
      setForm({
        contractId: "",
        nome: "",
        descricao: "",
        dataInicio: "",
        dataFim: "",
        local: "",
        capacidade: "500",
      });
      fetchAll();
    } catch (e: any) {
      const body = await e?.context?.json?.().catch(() => null);
      showError(body?.error || e.message || "Falha ao ativar bilheteria.");
    } finally {
      setSubmitting(false);
    }
  };

  const settleEvent = async (eventId: string) => {
    try {
      const { error } = await supabase.functions.invoke("producer-release-event-funds", {
        body: { eventId, reason: "MANUAL_PRODUCER" },
      });
      if (error) throw error;
      showSuccess("Liquidação executada.");
      fetchAll();
    } catch (e: any) {
      const body = await e?.context?.json?.().catch(() => null);
      showError(body?.error || e.message || "Falha na liquidação.");
    }
  };

  const createAffiliate = async (eventId: string) => {
    try {
      const affiliateProfileId = prompt("ID do afiliado (profile_id):");
      if (!affiliateProfileId) return;
      const rate = prompt("Comissao % (padrao 5):") || "5";
      const { data, error } = await supabase.functions.invoke("producer-create-affiliate-link", {
        body: { eventId, affiliateProfileId, commissionRate: Number(rate) },
      });
      if (error) throw error;
      showSuccess(`Link criado: ${data?.link?.code || "-"}`);
    } catch (e: any) {
      const body = await e?.context?.json?.().catch(() => null);
      showError(body?.error || e.message || "Falha ao criar afiliado.");
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-indigo-600 w-10 h-10" /></div>;

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Painel do Produtor</h1>
          <p className="text-slate-500">Contratos, bilheteria, escrow e settlement em um fluxo unico.</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={openActivate} onOpenChange={setOpenActivate}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl gap-2 border-slate-200 font-bold">
                <Plus className="w-4 h-4" /> Ativar Bilheteria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Ativar Bilheteria por Contrato</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <select
                  value={form.contractId}
                  onChange={(e) => {
                    const c = eligibleContracts.find((x) => x.id === e.target.value);
                    setForm({
                      ...form,
                      contractId: e.target.value,
                      nome: c?.event_name || form.nome,
                      dataInicio: c?.data_evento ? new Date(c.data_evento).toISOString().slice(0, 16) : form.dataInicio,
                      local: c?.local || c?.event_location || form.local,
                    });
                  }}
                  className="w-full h-10 rounded-md border px-3"
                >
                  <option value="">Selecione contrato elegivel</option>
                  {eligibleContracts.map((c) => (
                    <option key={c.id} value={c.id}>{c.event_name} - {c.status_master || c.status}</option>
                  ))}
                </select>
                <Input placeholder="Nome do evento" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                <Input placeholder="Descricao" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
                <Input type="datetime-local" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} />
                <Input type="datetime-local" value={form.dataFim} onChange={(e) => setForm({ ...form, dataFim: e.target.value })} />
                <Input placeholder="Local" value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} />
                <Input type="number" placeholder="Capacidade" value={form.capacidade} onChange={(e) => setForm({ ...form, capacidade: e.target.value })} />
                <Button onClick={activateTicketing} disabled={submitting} className="w-full">
                  {submitting ? <Loader2 className="animate-spin" /> : "Ativar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard title="Ingressos Vendidos" value={stats.tickets_sold} icon={Users} color="blue" />
        <StatCard title="Receita Bruta" value={`R$ ${Number(stats.gross_revenue).toLocaleString("pt-BR")}`} icon={DollarSign} color="emerald" />
        <StatCard title="Conversao" value={`${Number(stats.conversion_rate).toFixed(1)}%`} icon={TrendingUp} color="indigo" />
        <StatCard title="Eventos Ativos" value={stats.active_events} icon={Ticket} color="amber" />
        <StatCard title="Escrow" value={`R$ ${Number(stats.escrow_balance).toLocaleString("pt-BR")}`} icon={BarChart3} color="orange" />
        <StatCard title="Liberado" value={`R$ ${Number(stats.released_balance).toLocaleString("pt-BR")}`} icon={DollarSign} color="green" />
      </div>

      <Card className="p-8 border-none shadow-xl bg-white rounded-[2rem] space-y-6">
        <h3 className="text-xl font-black text-slate-900">Eventos com Bilheteria</h3>
        {events.length === 0 ? (
          <p className="text-slate-500">Nenhum evento ativo ainda. Ative a bilheteria em um contrato.</p>
        ) : (
          <div className="space-y-4">
            {events.map((ev) => (
              <div key={ev.id} className="p-5 bg-slate-50 rounded-2xl border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h4 className="font-black text-slate-900">{ev.nome}</h4>
                  <p className="text-xs text-slate-500">{new Date(ev.data_inicio).toLocaleString("pt-BR")} - {ev.local}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Status: {ev.status} | Vendidos: {ev.tickets_sold} | Bruto: R$ {Number(ev.gross_revenue).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => createAffiliate(ev.id)} className="rounded-xl">
                    <Share2 className="w-4 h-4 mr-1" /> Afiliado
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl">
                    <QrCode className="w-4 h-4 mr-1" /> Portaria
                  </Button>
                  <Button size="sm" onClick={() => settleEvent(ev.id)} className="rounded-xl bg-indigo-600">
                    Settlement
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => {
  const colorMap: Record<string, { bg: string; text: string }> = {
    blue: { bg: "bg-blue-50", text: "text-blue-600" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-600" },
    orange: { bg: "bg-orange-50", text: "text-orange-600" },
    green: { bg: "bg-green-50", text: "text-green-600" },
  };
  const classes = colorMap[color] || { bg: "bg-slate-50", text: "text-slate-600" };

  return (
    <Card className="p-4 border-none shadow-sm bg-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
          <h3 className="text-xl font-black text-slate-900 mt-1">{value}</h3>
        </div>
        <div className={`p-2 rounded-xl ${classes.bg}`}>
          <Icon className={`w-5 h-5 ${classes.text}`} />
        </div>
      </div>
    </Card>
  );
};

export default ProducerDashboard;
