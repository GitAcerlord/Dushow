"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldCheck, Star, CheckCircle2, XCircle, Loader2, DollarSign } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

type ProfileApproval = {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
  plan_tier?: string | null;
  is_verified?: boolean | null;
  is_superstar?: boolean | null;
  created_at?: string | null;
};

type ApprovalRequest = {
  id: string;
  name: string;
  avatar_url?: string | null;
  type: "VERIFIED" | "SUPERSTAR";
  requestDate: string;
  profileId: string;
};

const AdminApprovals = () => {
  const [profiles, setProfiles] = useState<ProfileApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, plan_tier, is_verified, is_superstar, created_at")
        .eq("role", "PRO")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProfiles((data as ProfileApproval[]) || []);
    } catch (error: any) {
      showError(error.message || "Erro ao carregar fila de aprovacoes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const requests = useMemo<ApprovalRequest[]>(() => {
    return profiles
      .flatMap((profile) => {
        const rows: ApprovalRequest[] = [];
        if (profile.plan_tier === "verified" && !profile.is_verified) {
          rows.push({
            id: `${profile.id}-verified`,
            name: profile.full_name || "Sem nome",
            avatar_url: profile.avatar_url,
            type: "VERIFIED",
            requestDate: profile.created_at || "",
            profileId: profile.id,
          });
        }
        if (profile.plan_tier === "superstar" && !profile.is_superstar) {
          rows.push({
            id: `${profile.id}-superstar`,
            name: profile.full_name || "Sem nome",
            avatar_url: profile.avatar_url,
            type: "SUPERSTAR",
            requestDate: profile.created_at || "",
            profileId: profile.id,
          });
        }
        return rows;
      })
      .sort((a, b) => {
        const da = a.requestDate ? new Date(a.requestDate).getTime() : 0;
        const db = b.requestDate ? new Date(b.requestDate).getTime() : 0;
        return db - da;
      });
  }, [profiles]);

  const approvalStats = useMemo(() => {
    const verifiedPending = requests.filter((request) => request.type === "VERIFIED").length;
    const superstarPending = requests.filter((request) => request.type === "SUPERSTAR").length;
    return {
      verifiedPending,
      superstarPending,
      totalPending: requests.length,
      estimatedRevenue: verifiedPending * 49.9 + superstarPending * 149.9,
    };
  }, [requests]);

  const updateProfile = async (profileId: string, updates: Record<string, unknown>) => {
    setActionId(profileId);
    try {
      const { error } = await supabase.functions.invoke("admin-actions", {
        body: {
          targetUserId: profileId,
          updates,
        },
      });

      if (error) throw error;
      await fetchProfiles();
      return true;
    } catch (error: any) {
      showError(error.message || "Erro ao processar aprovacao.");
      return false;
    } finally {
      setActionId(null);
    }
  };

  const handleApprove = async (request: ApprovalRequest) => {
    const updates =
      request.type === "VERIFIED"
        ? { is_verified: true, plan_tier: "verified" }
        : { is_superstar: true, plan_tier: "superstar" };
    const success = await updateProfile(request.profileId, updates);
    if (success) showSuccess(`Selo ${request.type} concedido para ${request.name}.`);
  };

  const handleReject = async (request: ApprovalRequest) => {
    const updates =
      request.type === "VERIFIED"
        ? { is_verified: false, plan_tier: "pro" }
        : { is_superstar: false, plan_tier: "pro" };
    const success = await updateProfile(request.profileId, updates);
    if (success) showSuccess(`Solicitacao de ${request.name} rejeitada.`);
  };

  if (loading) {
    return (
      <div className="p-20 flex justify-center">
        <Loader2 className="animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Aprovacao de Selos</h1>
          <p className="text-slate-500 mt-1">Valide perfis com solicitacoes de selo em aberto.</p>
        </div>
        <Card className="px-4 py-2 border-none shadow-sm bg-white flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-sm font-bold text-slate-700">{approvalStats.totalPending} Pendentes</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-none shadow-sm bg-indigo-600 text-white">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-6 h-6 text-indigo-200" />
            <h3 className="font-bold">Selo Verificado</h3>
          </div>
          <p className="text-3xl font-bold">{approvalStats.verifiedPending}</p>
          <p className="text-indigo-100 text-xs mt-2">Solicitacoes aguardando analise.</p>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-amber-500 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Star className="w-6 h-6 text-amber-200" />
            <h3 className="font-bold">Selo Superstar</h3>
          </div>
          <p className="text-3xl font-bold">{approvalStats.superstarPending}</p>
          <p className="text-amber-50 text-xs mt-2">Solicitacoes de destaque premium.</p>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            <h3 className="font-bold text-slate-900">Receita Pendente</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">R$ {approvalStats.estimatedRevenue.toLocaleString("pt-BR")}</p>
          <p className="text-slate-400 text-xs mt-2">Estimativa das solicitacoes em fila.</p>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold text-slate-900">Fila de Verificacao</h3>
        </div>
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Artista</TableHead>
              <TableHead>Selo Solicitado</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                  Nenhuma solicitacao pendente.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={request.avatar_url || undefined} />
                        <AvatarFallback>{request.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-bold text-slate-900 text-sm">{request.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={request.type === "SUPERSTAR" ? "bg-amber-500" : "bg-blue-500"}>{request.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-bold text-emerald-600">CONFIRMADO</span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {request.requestDate ? new Date(request.requestDate).toLocaleString() : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-100 hover:bg-red-50"
                        disabled={actionId === request.profileId}
                        onClick={() => handleReject(request)}
                      >
                        {actionId === request.profileId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-1" /> Rejeitar
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        disabled={actionId === request.profileId}
                        onClick={() => handleApprove(request)}
                      >
                        {actionId === request.profileId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Aprovar
                          </>
                        )}
                      </Button>
                    </div>
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

export default AdminApprovals;
