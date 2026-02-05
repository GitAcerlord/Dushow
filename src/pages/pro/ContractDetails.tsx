"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, Loader2, ArrowLeft, Fingerprint, CheckCircle2, DollarSign, MessageSquare, Save
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

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
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
        pro:profiles!contracts_pro_id_fkey(full_name, id, avatar_url)
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
          status: 'PENDING', // Volta para pendente para nova aprovação
          signed_by_client: false,
          signed_by_pro: false
        })
        .eq('id', id);

      if (error) throw error;
      showSuccess("Contra-proposta enviada com sucesso!");
      setIsNegotiating(false);
      fetchContract();
    } catch (error: any) {
      showError("Erro ao enviar negociação.");
    }
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  const isOwner = user?.id === contract.pro_id || user?.id === contract.client_id;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-slate-500 font-bold">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <Badge className="bg-indigo-600 text-white px-4 py-1.5 rounded-full uppercase tracking-widest">
          {contract.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="p-12 border-none shadow-2xl bg-white rounded-[2.5rem] space-y-10">
            <div className="flex items-center gap-4 border-b pb-8">
              <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase">Contrato de Prestação de Serviços</h2>
                <p className="text-xs text-slate-400">ID: {contract.id}</p>
              </div>
            </div>

            <div className="space-y-6 text-slate-700">
              <p><strong>Evento:</strong> {contract.event_name}</p>
              <p><strong>Data:</strong> {new Date(contract.event_date).toLocaleDateString()}</p>
              <p className="text-2xl font-black text-indigo-600">Valor: R$ {Number(contract.value).toLocaleString('pt-BR')}</p>
              
              {contract.negotiation_reason && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                  <p className="text-xs font-bold text-amber-800 uppercase mb-1">Motivo da última negociação:</p>
                  <p className="text-sm text-amber-700 italic">"{contract.negotiation_reason}"</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {contract.status === 'PENDING' && isOwner && (
            <Card className="p-8 border-none shadow-xl bg-white rounded-[2rem] space-y-6">
              <h3 className="font-black text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-600" />
                Negociar Valor
              </h3>
              
              {isNegotiating ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Novo Valor (R$)</Label>
                    <Input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Motivo da Alteração</Label>
                    <Textarea 
                      placeholder="Explique o motivo da mudança de preço..." 
                      value={reason} 
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setIsNegotiating(false)} variant="ghost" className="flex-1">Cancelar</Button>
                    <Button onClick={handleNegotiate} className="bg-indigo-600 flex-1">Enviar</Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setIsNegotiating(true)} className="w-full bg-slate-900 rounded-xl gap-2">
                  <MessageSquare className="w-4 h-4" /> Propor Novo Valor
                </Button>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractDetails;