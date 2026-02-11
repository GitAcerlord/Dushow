"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Loader2, ArrowLeft, CheckCircle2, FileText, MapPin, 
  Calendar, DollarSign, ShieldCheck, AlertCircle, User
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

const ContractDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isReleasing, setIsReleasing] = useState(false);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *, 
          client:profiles!contracts_client_id_fkey(*), 
          pro:profiles!contracts_pro_id_fkey(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Contrato não localizado.");

      setContract(data);
    } catch (error: any) {
      console.error("Fetch Contract Error:", error);
      showError(error.message || "Erro ao carregar detalhes do contrato.");
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseFunds = async () => {
    if (!user || !contract) return;
    setIsReleasing(true);
    try {
      const { data, error } = await supabase.functions.invoke('contract-state-machine', {
        body: { 
          contractId: id, 
          action: 'COMPLETE_EVENT', 
          userId: user.id 
        }
      });

      if (error) {
        const errorBody = await error.context?.json();
        throw new Error(errorBody?.error || error.message);
      }

      showSuccess("Evento confirmado! O pagamento foi liberado para o artista.");
      fetchData();
    } catch (error: any) {
      showError(error.message || "Erro ao liberar fundos.");
    } finally {
      setIsReleasing(false);
    }
  };

  const formatCurrency = (v: any) => {
    const n = Number(v);
    if (!isFinite(n)) return '—';
    return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const handleOpenDispute = async () => {
    const reason = window.prompt('Descreva brevemente o motivo da disputa (danos, falha, etc):');
    if (!reason) return;
    try {
      const { data, error } = await supabase.functions.invoke('contract-state-machine', {
        body: { contractId: id, action: 'OPEN_DISPUTE', openedBy: user?.id, reason }
      });
      if (error) {
        const errBody = await error.context?.json();
        throw new Error(errBody?.error || error.message);
      }
      showSuccess('Disputa aberta. Um administrador irá revisar.');
      fetchData();
    } catch (e: any) {
      showError(e.message || 'Erro ao abrir disputa.');
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-100px)] flex items-center justify-center">
        <Loader2 className="animate-spin w-10 h-10 text-indigo-600" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
        <p className="text-slate-500 font-medium">Contrato não encontrado ou você não tem permissão para visualizá-lo.</p>
        <Button onClick={() => navigate(-1)} variant="outline">Voltar</Button>
      </div>
    );
  }

  const isClient = user?.id === contract.client_id;
  const canRelease = isClient && contract.status === 'PAID';

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Button>

      <Card className="p-6 md:p-10 border-none shadow-2xl bg-white rounded-[2.5rem] space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b pb-8">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-4 rounded-2xl text-white shadow-lg",
              isClient ? "bg-blue-600" : "bg-indigo-600"
            )}>
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{contract.event_name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black text-slate-400 uppercase">Status:</span>
                <Badge className={cn(
                  "uppercase text-[10px] font-bold px-3 py-1 rounded-full border-none",
                  contract.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 
                  contract.status === 'PAID' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'
                )}>
                  {contract.status}
                </Badge>
              </div>
            </div>
          </div>
          <div className="text-left md:text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor do Cachê</p>
            <p className={cn(
              "text-3xl font-black",
              isClient ? "text-blue-600" : "text-indigo-600"
            )}>
              {formatCurrency(contract.value)}
            </p>
          </div>
        </div>

        {canRelease && (
          <Card className="p-6 bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-emerald-900">O evento já aconteceu?</h4>
                <p className="text-xs text-emerald-700 font-medium">Confirme a realização para liberar o pagamento seguro ao artista.</p>
              </div>
            </div>
            <Button 
              onClick={handleReleaseFunds} 
              disabled={isReleasing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black px-8 h-14 shadow-xl shadow-emerald-100 w-full md:w-auto"
            >
              {isReleasing ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
              Confirmar & Liberar Pagamento
            </Button>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                <User className="w-3 h-3" /> {isClient ? "Artista Contratado" : "Contratante"}
              </Label>
              <p className="font-bold text-slate-900 text-lg">
                {isClient ? contract.pro?.full_name : contract.client?.full_name}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Data do Evento
              </Label>
              <p className="font-bold text-slate-900 text-lg">
                {new Date(contract.event_date).toLocaleDateString('pt-BR', { 
                  day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                })}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Localização
              </Label>
              <p className="font-bold text-slate-900 text-lg">
                {contract.event_location || "Local não definido"}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Garantia DUSHOW
              </Label>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Este contrato está protegido pelo sistema de Escrow. O valor pago pelo cliente fica retido até a confirmação final.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ContractDetails;