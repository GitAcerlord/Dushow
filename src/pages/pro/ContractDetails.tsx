"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, Loader2, ArrowLeft, Fingerprint, CheckCircle2, Printer, CreditCard, ShieldCheck
} from "lucide-react";
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
        pro:profiles!contracts_pro_id_fkey(full_name, id, avatar_url, price)
      `)
      .eq('id', id)
      .single();

    if (error) {
      showError("Erro ao carregar contrato.");
      navigate(-1);
    } else {
      setContract(data);
    }
    setLoading(false);
  };

  const handleSign = async () => {
    if (!user || signing) return;
    setSigning(true);
    try {
      const isClient = user.id === contract.client_id;
      
      // Chamada real para a Edge Function de Assinatura Digital
      const { data, error } = await supabase.functions.invoke('digital-signature', {
        body: {
          contractId: id,
          userId: user.id,
          role: isClient ? 'CLIENT' : 'PRO'
        }
      });

      if (error) throw error;

      showSuccess("Assinatura digital registrada com sucesso!");
      await fetchContract();
    } catch (error: any) {
      showError(error.message || "Falha na assinatura digital.");
    } finally {
      setSigning(false);
    }
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  const isFullySigned = contract.signed_by_client && contract.signed_by_pro;
  const isClient = user?.id === contract.client_id;
  const hasSigned = isClient ? contract.signed_by_client : contract.signed_by_pro;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-slate-500 font-bold">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <Badge className={cn(
          "px-4 py-1.5 rounded-full font-black uppercase tracking-widest",
          contract.status === 'PAID' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
        )}>
          {contract.status === 'PAID' ? 'Contrato Liquidado' : 'Aguardando Formalização'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="p-12 border-none shadow-2xl bg-white rounded-[2.5rem] relative overflow-hidden min-h-[700px]">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] rotate-[-30deg]">
              <h1 className="text-9xl font-black">DUSHOW SECURE</h1>
            </div>

            <div className="relative z-10 space-y-10">
              <div className="flex justify-between items-start border-b pb-8">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-100">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Contrato de Prestação de Serviços</h2>
                    <p className="text-xs text-slate-400 font-mono">HASH: {contract.signature_hash || 'PENDENTE'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-8 text-slate-700 text-sm leading-relaxed">
                <section className="space-y-4">
                  <h4 className="font-black text-slate-900 uppercase border-l-4 border-indigo-600 pl-3">Cláusula 1ª - Das Partes</h4>
                  <p><strong>CONTRATANTE:</strong> {contract.client?.full_name}</p>
                  <p><strong>CONTRATADO (ARTISTA):</strong> {contract.pro?.full_name}</p>
                </section>

                <section className="space-y-4">
                  <h4 className="font-black text-slate-900 uppercase border-l-4 border-indigo-600 pl-3">Cláusula 2ª - Do Evento</h4>
                  <p>O presente contrato tem como objeto a apresentação artística no evento <strong>{contract.event_name}</strong>, a realizar-se no dia <strong>{new Date(contract.event_date).toLocaleDateString('pt-BR')}</strong>.</p>
                </section>

                <section className="space-y-4">
                  <h4 className="font-black text-slate-900 uppercase border-l-4 border-indigo-600 pl-3">Cláusula 3ª - Do Pagamento</h4>
                  <p>O valor total acordado é de <strong>R$ {Number(contract.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>, que será retido pela plataforma DUSHOW (Escrow) e liberado ao ARTISTA após a conclusão do evento.</p>
                </section>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-8 border-none shadow-xl bg-white rounded-[2rem] space-y-6">
            <h3 className="font-black text-slate-900 flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-indigo-600" />
              Painel de Assinatura
            </h3>

            <div className="space-y-4">
              <div className={cn("p-4 rounded-2xl border transition-all", contract.signed_by_client ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100")}>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Contratante</p>
                <p className="text-sm font-bold text-slate-900">{contract.client?.full_name}</p>
                {contract.signed_by_client ? (
                  <div className="flex items-center gap-1 text-emerald-600 text-[10px] mt-1 font-bold">
                    <CheckCircle2 className="w-3 h-3" /> Assinado Digitalmente
                  </div>
                ) : <p className="text-[10px] text-amber-600 mt-1 font-bold">Pendente</p>}
              </div>

              <div className={cn("p-4 rounded-2xl border transition-all", contract.signed_by_pro ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100")}>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Artista</p>
                <p className="text-sm font-bold text-slate-900">{contract.pro?.full_name}</p>
                {contract.signed_by_pro ? (
                  <div className="flex items-center gap-1 text-emerald-600 text-[10px] mt-1 font-bold">
                    <CheckCircle2 className="w-3 h-3" /> Assinado Digitalmente
                  </div>
                ) : <p className="text-[10px] text-amber-600 mt-1 font-bold">Pendente</p>}
              </div>
            </div>

            {!hasSigned && contract.status !== 'PAID' && (
              <Button onClick={handleSign} disabled={signing} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black shadow-lg shadow-indigo-100">
                {signing ? <Loader2 className="animate-spin" /> : "Assinar Agora"}
              </Button>
            )}

            {isFullySigned && isClient && contract.status !== 'PAID' && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <p className="text-[10px] text-blue-800 font-bold uppercase">Contrato Pronto para Pagamento</p>
                </div>
                <Button 
                  onClick={() => navigate('/client/checkout', { state: { artist: contract.pro, contractId: contract.id } })}
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-black gap-2"
                >
                  <CreditCard className="w-5 h-5" /> Pagar Cachê
                </Button>
              </div>
            )}

            {contract.status === 'PAID' && (
              <div className="p-6 bg-emerald-600 rounded-2xl text-white text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto" />
                <p className="font-black uppercase tracking-widest">Show Confirmado</p>
                <p className="text-[10px] opacity-80">O valor está seguro em Escrow.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContractDetails;