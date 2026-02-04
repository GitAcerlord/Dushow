"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ShieldCheck, Download, PenTool, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from "@/utils/toast";

const ContractDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    fetchContract();
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
    setSigning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const isClient = user?.id === contract.client_id;
      
      const updates = isClient 
        ? { signed_by_client: true, signed_at_client: new Date().toISOString() }
        : { signed_by_pro: true, signed_at_pro: new Date().toISOString() };

      const { error } = await supabase.from('contracts').update(updates).eq('id', id);
      if (error) throw error;

      showSuccess("Contrato assinado digitalmente!");
      fetchContract();
    } catch (error: any) {
      showError("Erro ao assinar contrato.");
    } finally {
      setSigning(false);
    }
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>;

  const contractText = `
    CONTRATO DE PRESTAÇÃO DE SERVIÇOS ARTÍSTICOS
    
    CONTRATANTE: ${contract.client?.full_name}
    CONTRATADO: ${contract.pro?.full_name}
    
    OBJETO: Prestação de serviço artístico para o evento "${contract.event_name}".
    DATA: ${new Date(contract.event_date).toLocaleDateString()} às ${new Date(contract.event_date).toLocaleTimeString()}
    LOCAL: ${contract.event_location}
    VALOR: R$ ${Number(contract.value).toLocaleString('pt-BR')}
    
    CLÁUSULAS:
    1. O contratado compromete-se a realizar a apresentação conforme rider técnico.
    2. O pagamento é garantido via sistema de Escrow DUSHOW.
    3. Em caso de cancelamento por parte do contratante com menos de 48h, o valor não será reembolsado.
  `;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Button>

      <Card className="p-8 border-none shadow-2xl bg-white rounded-[2rem] space-y-8">
        <div className="flex justify-between items-start border-b pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Contrato Digital #{contract.id.slice(0,8)}</h1>
              <p className="text-sm text-slate-500">Gerado automaticamente pela plataforma DUSHOW</p>
            </div>
          </div>
          <Badge className={contract.signed_by_client && contract.signed_by_pro ? "bg-emerald-500" : "bg-amber-500"}>
            {contract.signed_by_client && contract.signed_by_pro ? "TOTALMENTE ASSINADO" : "AGUARDANDO ASSINATURAS"}
          </Badge>
        </div>

        <div className="bg-slate-50 p-8 rounded-2xl font-mono text-xs leading-relaxed whitespace-pre-wrap border border-slate-100 text-slate-700">
          {contractText}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className={cn("p-6 border-2", contract.signed_by_client ? "border-emerald-100 bg-emerald-50/30" : "border-slate-100")}>
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Assinatura Contratante</p>
            <p className="font-bold text-slate-900">{contract.client?.full_name}</p>
            {contract.signed_by_client ? (
              <div className="mt-4 flex items-center gap-2 text-emerald-600 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" /> Assinado em {new Date(contract.signed_at_client).toLocaleString()}
              </div>
            ) : (
              <Button onClick={handleSign} disabled={signing} className="mt-4 w-full bg-indigo-600">Assinar Agora</Button>
            )}
          </Card>

          <Card className={cn("p-6 border-2", contract.signed_by_pro ? "border-emerald-100 bg-emerald-50/30" : "border-slate-100")}>
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Assinatura Profissional</p>
            <p className="font-bold text-slate-900">{contract.pro?.full_name}</p>
            {contract.signed_by_pro ? (
              <div className="mt-4 flex items-center gap-2 text-emerald-600 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" /> Assinado em {new Date(contract.signed_at_pro).toLocaleString()}
              </div>
            ) : (
              <Button onClick={handleSign} disabled={signing} className="mt-4 w-full bg-indigo-600">Assinar Agora</Button>
            )}
          </Card>
        </div>
      </Card>
    </div>
  );
};

export default ContractDetails;