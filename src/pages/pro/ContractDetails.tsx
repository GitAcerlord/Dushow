"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  FileText, Loader2, ArrowLeft, DollarSign, MessageSquare, CheckCircle2, XCircle, CreditCard
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

const ContractDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [newPrice, setNewPrice] = useState("");
  const [reason, setReason] = useState("");
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
      
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authUser.id)
          .single();
        setUserRole(profile?.role || "");
      }
      
      await fetchContract();
    };
    init();
  }, [id]);

  const fetchContract = async () => {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        client:profiles!contracts_client_id_fkey(full_name, id, avatar_url),
        pro:profiles!contracts_pro_id_fkey(full_name, id, avatar_url, price)
      `)
      .eq('id', id)
      .single();

    if (error) {
      showError("Erro ao carregar contrato.");
      navigate(-1);
    } else {
      setContract(data);
      setNewPrice(data.value.toString());
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      showSuccess(`Contrato ${newStatus === 'ACCEPTED' ? 'aceito' : 'cancelado'} com sucesso!`);
      fetchContract();
    } catch (error: any) {
      showError("Erro ao atualizar contrato.");
    }
  };

  const handleNegotiate = async () => {
    if (!reason.trim()) {
      showError("Por favor, informe o motivo da alteração de preço.");
      return;
    }

    try {
      const { error } = await supabase
        .from('contracts')
        .update({ 
          value: parseFloat(newPrice),
          negotiation_reason: reason,
          status: 'PENDING',
          signed_by_client: false,
          signed_by_pro: false
        })
        .eq('id', id);

      if (error) throw error;
      showSuccess("Contra-proposta enviada com sucesso!");
      setIsNegotiating(false);
      setReason("");
      fetchContract();
    } catch (error: any) {
      showError("Erro ao enviar negociação.");
    }
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  const isClient = userRole === 'CLIENT';
  const isPro = userRole === 'PRO';

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-slate-500 font-bold">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <Badge className={cn(
          "px-4 py-1.5 rounded-full uppercase tracking-widest font-bold",
          contract.status === 'PAID' ? 'bg-emerald-500 text-white' : 
          contract.status === 'ACCEPTED' ? 'bg-blue-500 text-white' :
          contract.status === 'PENDING' ? 'bg-amber-500 text-white' : 
          contract.status === 'REJECTED' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500'
        )}>
          {contract.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="p-8 md:p-12 border-none shadow-2xl bg-white rounded-[2.5rem] space-y-10">
            <div className="flex items-center gap-4 border-b pb-8">
              <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase">Contrato de Prestação de Serviços</h2>
                <p className="text-xs text-slate-400">ID: {contract.id}</p>
              </div>
            </div>

            <div className="space-y-6 text-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Contratante</p>
                  <p className="font-bold text-slate-900">{contract.client?.full_name}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Artista</p>
                  <p className="font-bold text-slate-900">{contract.pro?.full_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Evento</p>
                  <p className="font-bold text-slate-900">{contract.event_name}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Data e Hora</p>
                  <p className="font-bold text-slate-900">{new Date(contract.event_date).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Localização</p>
                <p className="font-bold text-slate-900">{contract.event_location || "A definir"}</p>
              </div>

              <div className="pt-6 border-t">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Valor do Cachê</p>
                <p className="text-3xl font-black text-indigo-600">R$ {Number(contract.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              
              {contract.negotiation_reason && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                  <p className="text-xs font-bold text-amber-800 uppercase mb-1">Última Observação de Negociação:</p>
                  <p className="text-sm text-amber-700 italic">"{contract.negotiation_reason}"</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Ações do Contratante quando PENDENTE */}
          {isClient && contract.status === 'PENDING' && (
            <Card className="p-8 border-none shadow-xl bg-white rounded-[2rem] space-y-4">
              <h3 className="font-black text-slate-900 text-lg">Decisão da Proposta</h3>
              <p className="text-sm text-slate-500">Você recebeu uma proposta/contraproposta. Como deseja prosseguir?</p>
              
              <Button 
                onClick={() => handleUpdateStatus('ACCEPTED')} 
                className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 rounded-xl gap-2 font-bold"
              >
                <CheckCircle2 className="w-4 h-4" /> Aceitar Proposta
              </Button>

              <Button 
                onClick={() => setIsNegotiating(true)} 
                variant="outline"
                className="w-full border-indigo-100 text-indigo-600 h-12 rounded-xl gap-2 font-bold"
              >
                <MessageSquare className="w-4 h-4" /> Negociar Valor
              </Button>

              <Button 
                onClick={() => handleUpdateStatus('CANCELLED')} 
                variant="ghost"
                className="w-full text-red-500 hover:bg-red-50 h-12 rounded-xl gap-2 font-bold"
              >
                <XCircle className="w-4 h-4" /> Cancelar Solicitação
              </Button>
            </Card>
          )}

          {/* Ações do Contratante quando ACEITO (Ir para Pagamento) */}
          {isClient && contract.status === 'ACCEPTED' && (
            <Card className="p-8 border-none shadow-xl bg-indigo-600 text-white rounded-[2rem] space-y-4">
              <h3 className="font-black text-lg">Proposta Aceita!</h3>
              <p className="text-sm text-indigo-100">O valor foi acordado. Realize o pagamento para garantir a data na agenda do artista.</p>
              <Button 
                onClick={() => navigate('/client/checkout', { state: { artist: contract.pro, contractId: contract.id } })}
                className="w-full bg-white text-indigo-600 hover:bg-indigo-50 h-14 rounded-xl gap-2 font-black text-lg shadow-lg"
              >
                <CreditCard className="w-5 h-5" /> Pagar Agora
              </Button>
            </Card>
          )}

          {/* Ações do Artista quando PENDENTE */}
          {isPro && contract.status === 'PENDING' && (
            <Card className="p-8 border-none shadow-xl bg-white rounded-[2rem] space-y-4">
              <h3 className="font-black text-slate-900 text-lg">Gerenciar Proposta</h3>
              <Button 
                onClick={() => handleUpdateStatus('ACCEPTED')} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl gap-2 font-bold"
              >
                <CheckCircle2 className="w-4 h-4" /> Aceitar Proposta
              </Button>
              <Button 
                onClick={() => setIsNegotiating(true)} 
                variant="outline"
                className="w-full border-slate-200 h-12 rounded-xl gap-2 font-bold"
              >
                <MessageSquare className="w-4 h-4" /> Contraproposta
              </Button>
            </Card>
          )}

          {/* Modal/Form de Negociação (Shared) */}
          {isNegotiating && (
            <Card className="p-8 border-none shadow-xl bg-slate-50 rounded-[2rem] space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="font-black text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-600" />
                Nova Contraproposta
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-400">Novo Valor (R$)</Label>
                  <Input 
                    type="number" 
                    value={newPrice} 
                    onChange={(e) => setNewPrice(e.target.value)} 
                    className="h-12 bg-white border-none rounded-xl shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-400">Motivo / Observação</Label>
                  <Textarea 
                    placeholder="Explique o motivo da alteração..." 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)}
                    className="bg-white border-none rounded-xl shadow-sm min-h-[100px]"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setIsNegotiating(false)} variant="ghost" className="flex-1 rounded-xl">Cancelar</Button>
                  <Button onClick={handleNegotiate} className="bg-indigo-600 flex-1 rounded-xl font-bold">Enviar</Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractDetails;