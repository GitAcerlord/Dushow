"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ShieldCheck, Loader2, ArrowLeft, Lock, Fingerprint } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

const ContractDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchContract();
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [id]);

  const fetchContract = async () => {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        client:profiles!contracts_client_id_fkey(full_name, id),
        pro:profiles!contracts_pro_id_fkey(full_name, id)
      `)
      .eq('id', id)
      .single();

    if (data) setContract(data);
    setLoading(false);
  };

  const handleSign = async () => {
    if (!user) return;
    setSigning(true);
    try {
      const isClient = user.id === contract.client_id;
      
      // Chamada para a Edge Function de Assinatura Real
      const { data, error } = await supabase.functions.invoke('digital-signature', {
        body: {
          contractId: id,
          userId: user.id,
          role: isClient ? 'CLIENT' : 'PRO'
        }
      });

      if (error) throw error;

      showSuccess("Assinatura digital registrada com sucesso!");
      fetchContract();
    } catch (error: any) {
      showError("Falha ao processar assinatura digital.");
    } finally {
      setSigning(false);
    }
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  const isSignedByMe = user?.id === contract.client_id ? contract.signed_by_client : contract.signed_by_pro;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-slate-500">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Button>

      <Card className="p-8 border-none shadow-2xl bg-white rounded-[2.5rem] space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start border-b pb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Contrato Digital DUSHOW</h1>
              <p className="text-xs text-slate-400 font-mono">ID: {contract.id}</p>
            </div>
          </div>
          <Badge className={cn(
            "px-4 py-1.5 rounded-full font-bold",
            contract.signed_by_client && contract.signed_by_pro ? "bg-emerald-500" : "bg-amber-500"
          )}>
            {contract.signed_by_client && contract.signed_by_pro ? "CONTRATO FORMALIZADO" : "AGUARDANDO ASSINATURAS"}
          </Badge>
        </div>

        {/* Visualização do Contrato */}
        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 relative">
          <div className="absolute top-4 right-4 opacity-10">
            <Fingerprint className="w-24 h-24" />
          </div>
          <div className="prose prose-slate max-w-none text-sm leading-relaxed">
            <h3 className="text-center font-black uppercase mb-8">Termos de Prestação de Serviço</h3>
            <p><strong>CONTRATANTE:</strong> {contract.client?.full_name}</p>
            <p><strong>CONTRATADO:</strong> {contract.pro?.full_name}</p>
            <p><strong>EVENTO:</strong> {contract.event_name}</p>
            <p><strong>DATA/HORA:</strong> {new Date(contract.event_date).toLocaleString('pt-BR')}</p>
            <p><strong>VALOR DO CACHÊ:</strong> R$ {Number(contract.value).toLocaleString('pt-BR')}</p>
            <div className="mt-8 p-4 bg-white rounded-xl border border-slate-200 italic text-xs">
              Este documento possui validade jurídica conforme a MP 2.200-2/2001, sendo as assinaturas colhidas através de evidências digitais (IP, Timestamp e Hash de Integridade).
            </div>
          </div>
        </div>

        {/* Painel de Assinaturas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SignatureStatusCard 
            label="Contratante"
            name={contract.client?.full_name}
            isSigned={contract.signed_by_client}
            date={contract.signed_at_client}
            metadata={contract.client_signature_metadata}
            canSign={user?.id === contract.client_id && !contract.signed_by_client}
            onSign={handleSign}
            loading={signing}
          />
          <SignatureStatusCard 
            label="Profissional"
            name={contract.pro?.full_name}
            isSigned={contract.signed_by_pro}
            date={contract.signed_at_pro}
            metadata={contract.pro_signature_metadata}
            canSign={user?.id === contract.pro_id && !contract.signed_by_pro}
            onSign={handleSign}
            loading={signing}
          />
        </div>

        {contract.document_hash && (
          <div className="pt-6 border-t flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>HASH DE INTEGRIDADE: {contract.document_hash}</span>
            <div className="flex items-center gap-1 text-emerald-600 font-bold">
              <Lock className="w-3 h-3" /> PROTEGIDO POR CRIPTOGRAFIA
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

const SignatureStatusCard = ({ label, name, isSigned, date, metadata, canSign, onSign, loading }: any) => (
  <Card className={cn(
    "p-6 border-2 transition-all rounded-3xl",
    isSigned ? "border-emerald-100 bg-emerald-50/30" : "border-slate-100 bg-white"
  )}>
    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">{label}</p>
    <p className="font-bold text-slate-900">{name}</p>
    
    {isSigned ? (
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
          <ShieldCheck className="w-4 h-4" /> Assinado Digitalmente
        </div>
        <p className="text-[10px] text-slate-400">Data: {new Date(date).toLocaleString()}</p>
        <p className="text-[10px] text-slate-400">IP: {metadata?.ip}</p>
      </div>
    ) : canSign ? (
      <Button 
        onClick={onSign} 
        disabled={loading}
        className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold h-12 shadow-lg shadow-indigo-100"
      >
        {loading ? <Loader2 className="animate-spin" /> : "Assinar Contrato"}
      </Button>
    ) : (
      <div className="mt-4 text-xs text-slate-400 italic">Aguardando assinatura...</div>
    )}
  </Card>
);

export default ContractDetails;