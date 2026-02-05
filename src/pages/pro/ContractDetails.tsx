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
  FileText, Loader2, ArrowLeft, DollarSign, MessageSquare, CheckCircle2, XCircle, CreditCard, History, Clock
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

const ContractDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState<any>(null);
  const [negotiations, setNegotiations] = useState<any[]>([]);
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
      await fetchNegotiations();
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

  const fetchNegotiations = async () => {
    const { data } = await supabase
      .from('contract_negotiations')
      .select('*')
      .eq('contract_id', id)
      .order('created_at', { ascending: false });
    setNegotiations(data || []);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      // Notificar a outra parte
      const recipientId = userRole === 'CLIENT' ? contract.pro_id : contract.client_id;
      await supabase.from('notifications').insert({
        user_id: recipientId,
        title: 'Status do Contrato Atualizado',
        content: `O contrato para "${contract.event_name}" foi ${newStatus.toLowerCase()}.`,
        type: 'CONTRACT',
        link: `/client/contracts/${id}`
      });

      showSuccess(`Contrato ${newStatus.toLowerCase()} com sucesso!`);
      fetchContract();
    } catch (error: any) {
      showError("Erro ao atualizar contrato.");
    }
  };

  const handleNegotiate = async () => {
    if (!reason.trim()) {
      showError("Por favor, informe o motivo da alteração.");
      return;
    }

    try {
      // 1. Registrar no histórico
      await supabase.from('contract_negotiations').insert({
        contract_id: id,
        sender_id: user.id,
        old_value: contract.value,
        new_value: parseFloat(newPrice),
        reason: reason
      });

      // 2. Atualizar contrato
      const { error } = await supabase
        .from('contracts')
        .update({ 
          value: parseFloat(newPrice),
          negotiation_reason: reason,
          status: 'PENDING'
        })
        .eq('id', id);

      if (error) throw error;

      // 3. Notificar a outra parte
      const recipientId = userRole === 'CLIENT' ? contract.pro_id : contract.client_id;
      await supabase.from('notifications').insert({
        user_id: recipientId,
        title: 'Nova Contraproposta',
        content: `Você recebeu uma nova proposta de valor para "${contract.event_name}".`,
        type: 'CONTRACT',
        link: `/client/contracts/${id}`
      });

      showSuccess("Contraproposta enviada!");
      setIsNegotiating(false);
      setReason("");
      fetchContract();
      fetchNegotiations();
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
        <div className="lg:col-span-2 space-y-8">
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

              <div className="pt-6 border-t">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Valor Atual</p>
                <p className="text-3xl font-black text-indigo-600">R$ {Number(contract.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </Card>

          {/* Histórico de Negociações */}
          <div className="space-y-4">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              Histórico de Negociação
            </h3>
            <div className="space-y-4">
              {negotiations.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Nenhuma alteração registrada ainda.</p>
              ) : (
                negotiations.map((neg) => (
                  <Card key={neg.id} className="p-4 border-none shadow-sm bg-white rounded-2xl flex gap-4 items-start">
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <Clock className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-bold text-slate-900">
                          {neg.sender_id === contract.client_id ? 'Contratante' : 'Artista'} propôs novo valor
                        </p>
                        <span className="text-[10px] text-slate-400">{new Date(neg.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-lg font-black text-indigo-600 mt-1">R$ {Number(neg.new_value).toLocaleString('pt-BR')}</p>
                      <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg italic">"{neg.reason}"</p>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {contract.status === 'PENDING' && (
            <Card className="p-8 border-none shadow-xl bg-white rounded-[2rem] space-y-4">
              <h3 className="font-black text-slate-900 text-lg">Ações Disponíveis</h3>
              <Button 
                onClick={() => handleUpdateStatus('ACCEPTED')} 
                className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 rounded-xl gap-2 font-bold"
              >
                <CheckCircle2 className="w-4 h-4" /> Aceitar
              </Button>
              <Button 
                onClick={() => setIsNegotiating(true)} 
                variant="outline"
                className="w-full border-indigo-100 text-indigo-600 h-12 rounded-xl gap-2 font-bold"
              >
                <MessageSquare className="w-4 h-4" /> Contraproposta
              </Button>
              <Button 
                onClick={() => handleUpdateStatus('REJECTED')} 
                variant="ghost"
                className="w-full text-red-500 hover:bg-red-50 h-12 rounded-xl gap-2 font-bold"
              >
                <XCircle className="w-4 h-4" /> Rejeitar
              </Button>
            </Card>
          )}

          {isClient && contract.status === 'ACCEPTED' && (
            <Card className="p-8 border-none shadow-xl bg-indigo-600 text-white rounded-[2rem] space-y-4">
              <h3 className="font-black text-lg">Pronto para Pagamento</h3>
              <p className="text-sm text-indigo-100">O valor foi acordado. Realize o pagamento para confirmar o show.</p>
              <Button 
                onClick={() => navigate('/client/checkout', { state: { artist: contract.pro, contractId: contract.id } })}
                className="w-full bg-white text-indigo-600 hover:bg-indigo-50 h-14 rounded-xl gap-2 font-black text-lg shadow-lg"
              >
                <CreditCard className="w-5 h-5" /> Pagar Agora
              </Button>
            </Card>
          )}

          {isNegotiating && (
            <Card className="p-8 border-none shadow-xl bg-slate-900 text-white rounded-[2rem] space-y-6">
              <h3 className="font-black flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-400" />
                Nova Proposta
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-400">Novo Valor (R$)</Label>
                  <Input 
                    type="number" 
                    value={newPrice} 
                    onChange={(e) => setNewPrice(e.target.value)} 
                    className="h-12 bg-white/10 border-none rounded-xl text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-400">Motivo</Label>
                  <Textarea 
                    placeholder="Explique o motivo..." 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)}
                    className="bg-white/10 border-none rounded-xl min-h-[100px] text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setIsNegotiating(false)} variant="ghost" className="flex-1 text-white">Cancelar</Button>
                  <Button onClick={handleNegotiate} className="bg-indigo-600 flex-1 font-bold">Enviar</Button>
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