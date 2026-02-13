"use client";

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  ArrowLeft,
  FileText,
  MapPin,
  Calendar,
  ShieldCheck,
  User,
  MessageSquare,
  ArrowRightLeft,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

const ContractDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          client:profiles!contracts_contratante_profile_id_fkey(full_name, avatar_url),
          pro:profiles!contracts_profissional_profile_id_fkey(full_name, avatar_url)
        `)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      setContract(data);
    } catch {
      showError("Falha ao carregar detalhes do contrato.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (action: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke("contract-state-machine", {
        body: { contractId: id, action },
      });
      if (error) throw error;
      showSuccess(`Status atualizado: ${action}`);
      fetchData();
    } catch {
      showError("Erro ao processar transicao de status.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCounterProposal = async () => {
    const raw = prompt("Novo valor de contraproposta (R$):");
    const newValue = Number(raw || 0);
    if (!newValue || newValue <= 0) return showError("Valor de contraproposta invalido.");

    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke("contract-state-machine", {
        body: { contractId: id, action: "COUNTER_PROPOSAL", newValue },
      });
      if (error) throw error;
      showSuccess("Contraproposta enviada.");
      fetchData();
    } catch (e: any) {
      showError(e.message || "Falha ao enviar contraproposta.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickReview = async () => {
    if (!contract || !isClient) return;
    const raw = prompt("Nota de 1 a 5 para este profissional:");
    const rating = Number(raw || 0);
    if (!rating || rating < 1 || rating > 5) return showError("Nota invalida.");
    const comment = prompt("Comentario (opcional):") || "";

    setIsReviewing(true);
    try {
      const { error } = await supabase.functions.invoke("submit-client-review", {
        body: {
          contractId: contract.id,
          proId: contract.profissional_profile_id,
          comment,
          punctuality: rating,
          quality: rating,
          professionalism: rating,
          communication: rating,
        },
      });
      if (error) {
        const errBody = await error.context?.json();
        throw new Error(errBody?.error || "Falha ao enviar avaliacao.");
      }
      showSuccess("Avaliacao enviada com sucesso.");
    } catch (e: any) {
      showError(e.message || "Erro ao enviar avaliacao.");
    } finally {
      setIsReviewing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#2D1B69] w-10 h-10" />
      </div>
    );
  }
  if (!contract) return <div className="p-20 text-center">Contrato nao localizado.</div>;

  const displayValue = Number(contract.valor_atual || 0);
  const isPro = user?.id === contract.profissional_profile_id;
  const isClient = user?.id === contract.contratante_profile_id;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-slate-500 font-bold mb-4">
        <ArrowLeft className="w-4 h-4" /> Voltar aos Contratos
      </Button>

      <Card className="p-10 border-none shadow-2xl bg-white rounded-[3rem] space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b pb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-[#2D1B69] rounded-2xl text-[#FFB703] shadow-lg">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#2D1B69] uppercase tracking-tighter leading-none">{contract.event_name}</h2>
              <Badge className="mt-2 bg-indigo-50 text-[#2D1B69] border-none font-black text-[10px] uppercase px-3 py-1">
                Status: {contract.status}
              </Badge>
            </div>
          </div>
          <div className="text-left md:text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cache Final</p>
            <p className="text-4xl font-black text-[#2D1B69]">
              R$ {displayValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Seu papel neste contrato: <span className="font-bold">{isClient ? "Contratante" : isPro ? "Profissional" : "Sem acesso"}</span>
            </p>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <ArrowRightLeft className="w-3 h-3" /> Acoes do Contrato
          </h4>

          <div className="flex flex-wrap gap-4">
            {contract.status === "PROPOSTO" && isPro && (
              <>
                <Button onClick={() => handleStatusChange("ACCEPT")} disabled={isProcessing} className="bg-[#2D1B69] h-12 px-8 rounded-xl font-bold">
                  Aceitar Proposta
                </Button>
                <Button variant="outline" onClick={() => handleStatusChange("REJECT")} disabled={isProcessing} className="h-12 px-8 rounded-xl font-bold border-red-100 text-red-600 hover:bg-red-50">
                  Recusar
                </Button>
              </>
            )}

            {contract.status === "PROPOSTO" && isClient && (
              <Button onClick={handleCounterProposal} disabled={isProcessing} className="bg-[#2D1B69] h-12 px-8 rounded-xl font-bold">
                Enviar Contraproposta
              </Button>
            )}

            {contract.status === "CONTRAPROPOSTA" && isPro && (
              <Button onClick={() => handleStatusChange("APPROVE_COUNTER")} className="bg-[#2D1B69] h-14 px-10 rounded-2xl font-black">
                Aprovar Contraproposta
              </Button>
            )}

            {contract.status === "AGUARDANDO_PAGAMENTO" && isClient && (
              <Button onClick={() => navigate("/app/checkout", { state: { artist: contract.pro, contractId: contract.id } })} className="bg-emerald-600 h-14 px-10 rounded-2xl font-black shadow-xl shadow-emerald-100">
                Efetuar Pagamento
              </Button>
            )}

            {contract.status === "PAGO_ESCROW" && (
              <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-2xl w-full border border-emerald-100">
                <ShieldCheck className="w-6 h-6" />
                <p className="text-xs font-bold uppercase">
                  Pagamento confirmado e seguro no Escrow. O repasse sera feito apos o evento.
                </p>
              </div>
            )}

            {contract.status === "PAGO_ESCROW" && (
              <Button onClick={() => handleStatusChange("START_EXECUTION")} className="bg-[#2D1B69] h-12 px-8 rounded-xl font-bold">
                Iniciar Execucao
              </Button>
            )}

            {contract.status === "EM_EXECUCAO" && (
              <Button onClick={() => handleStatusChange("CONFIRM_COMPLETION")} className="bg-[#2D1B69] h-12 px-8 rounded-xl font-bold">
                Confirmar Conclusao
              </Button>
            )}

            {contract.status === "CONCLUIDO" && isClient && (
              <Button onClick={handleQuickReview} disabled={isReviewing} className="bg-amber-500 h-12 px-8 rounded-xl font-bold">
                {isReviewing ? <Loader2 className="animate-spin" /> : "Avaliar Profissional"}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-8">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><User className="w-3 h-3" /> {isPro ? "Contratante" : "Profissional"}</Label>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                <img src={isPro ? contract.client?.avatar_url : contract.pro?.avatar_url} className="w-10 h-10 rounded-xl object-cover" />
                <p className="font-black text-[#2D1B69]">{isPro ? contract.client?.full_name : contract.pro?.full_name}</p>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> Data do Show</Label>
              <p className="text-xl font-bold text-slate-700">{new Date(contract.data_evento || contract.event_date).toLocaleDateString("pt-BR", { dateStyle: "full" })}</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> Localizacao</Label>
              <p className="text-xl font-bold text-slate-700">{contract.local || contract.event_location || "Local a definir"}</p>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Detalhes Adicionais</Label>
              <p className="text-sm text-slate-500 leading-relaxed italic">"{contract.descricao || contract.contract_text || "Sem observacoes."}"</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ContractDetails;
