"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, ShieldCheck, Loader2, ArrowLeft, Lock, 
  Fingerprint, CheckCircle2, AlertCircle, Download, Printer, CreditCard
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
      
      const { data, error } = await supabase.functions.invoke('digital-signature', {
        body: {
          contractId: id,
          userId: user.id,
          role: isClient ? 'CLIENT' : 'PRO'
        }
      });

      if (error) throw error;

      showSuccess("Contrato assinado digitalmente!");
      fetchContract();
    } catch (error: any) {
      showError("Erro ao processar assinatura.");
    } finally {
      setSigning(false);
    }
  };

  const handlePayment = () => {
    navigate('/client/checkout', { state: { artist: contract.pro, contractId: contract.id } });
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  const isFullySigned = contract.signed_by_client && contract.signed_by_pro;
  const isClient = user?.id === contract.client_id;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-slate-500 font-bold">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl gap-2">
            <Printer className="w-4 h-4" /> Imprimir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-12 border-none shadow-2xl bg-white rounded-[2.5rem] relative overflow-hidden min-h-[800px]">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-[-30deg]">
              <h1 className="text-9xl font-black">DUSHOW SECURE</h1>
            </div>

            <div className="relative z-10 space-y-10">
              <div className="flex justify-between items-start border-b pb-8">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-600 p-3 rounded-2xl text-white">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Contrato Digital</h2>
                    <p className="text-xs text-slate-400 font-mono">ID: {contract.id.split('-')[0].toUpperCase()}</p>
                  </div>
                </div>
              </div>

              <div className="prose prose-slate max-w-none space-y-8 text-slate-700">
                <section>
                  <h4 className="text-sm font-black text-slate-900 uppercase mb-4 border-l-4 border-indigo-600 pl-3">1. Das Partes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Contratante</p>
                      <p className="font-bold text-slate-900">{contract.client?.full_name}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Artista</p>
                      <p className="font-bold text-slate-900">{contract.pro?.full_name}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-sm font-black text-slate-900 uppercase mb-4 border-l-4 border-indigo-600 pl-3">2. Do Objeto</h4>
                  <p className="text-sm leading-relaxed">
                    Prestação de serviços artísticos para o evento <strong>{contract.event_name}</strong> em <strong>{new Date(contract.event_date).toLocaleDateString('pt-BR')}</strong>.
                  </p>
                </section>

                <section>
                  <h4 className="text-sm font-black text-slate-900 uppercase mb-4 border-l-4 border-indigo-600 pl-3">3. Do Valor</h4>
                  <p className="text-sm font-bold text-indigo-600">R$ {Number(contract.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </section>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 border-none shadow-xl bg-white rounded-[2rem] space-y-6">
            <h3 className="font-black text-slate-900 flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-indigo-600" />
              Assinaturas
            </h3>

            <div className="space-y-4">
              <SignatureItem label="Contratante" name={contract.client?.full_name} isSigned={contract.signed_by_client} date={contract.signed_at_client} />
              <SignatureItem label="Artista" name={contract.pro?.full_name} isSigned={contract.signed_by_pro} date={contract.signed_at_pro} />
            </div>

            {!isFullySigned && (
              <div className="pt-6 border-t">
                {((user?.id === contract.client_id && !contract.signed_by_client) || 
                  (user?.id === contract.pro_id && !contract.signed_by_pro)) ? (
                  <Button onClick={handleSign} disabled={signing} className="w-full h-14 bg-indigo-600 rounded-2xl font-black">
                    {signing ? <Loader2 className="animate-spin" /> : "Assinar Digitalmente"}
                  </Button>
                ) : (
                  <Badge variant="outline" className="w-full py-3 justify-center border-amber-100 text-amber-600">Aguardando Assinatura</Badge>
                )}
              </div>
            )}

            {isFullySigned && isClient && contract.status === 'PENDING' && (
              <div className="pt-6 border-t">
                <Button onClick={handlePayment} className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-black gap-2">
                  <CreditCard className="w-5 h-5" /> Pagar Cachê (Escrow)
                </Button>
              </div>
            )}

            {contract.status === 'PAID' && (
              <div className="p-4 bg-emerald-50 rounded-2xl flex flex-col items-center text-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                <p className="text-xs font-black text-emerald-900 uppercase">Pagamento Confirmado</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

const SignatureItem = ({ label, name, isSigned, date }: any) => (
  <div className={cn("p-4 rounded-2xl border", isSigned ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100")}>
    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{label}</p>
    <p className="text-sm font-bold text-slate-900">{name}</p>
    {isSigned && <p className="text-[9px] text-emerald-600 mt-1">Assinado em {new Date(date).toLocaleString('pt-BR')}</p>}
  </div>
);

export default ContractDetails;