"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Loader2, ArrowLeft, CheckCircle2, FileText, MapPin, 
  Calendar, DollarSign, ShieldCheck, AlertCircle, User, Ticket
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
  const [profile, setProfile] = useState<any>(null);
  const [isReleasing, setIsReleasing] = useState(false);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', authUser?.id).single();
      setProfile(profileData);

      // Corrigidos os joins para usar as FKs reais da tabela contracts
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *, 
          client:profiles!contracts_contratante_profile_id_fkey(*), 
          pro:profiles!contracts_profissional_profile_id_fkey(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setContract(data);
    } catch (error: any) {
      showError("Erro ao carregar contrato.");
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseFunds = async () => {
    setIsReleasing(true);
    try {
      await supabase.functions.invoke('contract-state-machine', {
        body: { contractId: id, action: 'COMPLETE_EVENT', userId: user.id }
      });
      showSuccess("Evento confirmado! Pagamento liberado.");
      fetchData();
    } catch (error: any) {
      showError("Erro ao liberar fundos.");
    } finally {
      setIsReleasing(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (!contract) return <div className="p-20 text-center">Contrato não localizado.</div>;

  const isClient = user?.id === contract.contratante_profile_id;
  const isProducer = profile?.active_context === 'PRODUCER';
  const canRelease = isClient && contract.status === 'PAID';

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-slate-500 font-bold">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Button>

      <Card className="p-10 border-none shadow-2xl bg-white rounded-[2.5rem] space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b pb-8">
          <div className="flex items-center gap-4">
            <div className={cn("p-4 rounded-2xl text-white shadow-lg", isClient ? "bg-blue-600" : "bg-indigo-600")}>
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{contract.event_name}</h2>
              <Badge className="mt-1 uppercase text-[10px] font-bold px-3 py-1 rounded-full">{contract.status}</Badge>
            </div>
          </div>
          <div className="text-left md:text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor do Cachê</p>
            <p className={cn("text-3xl font-black", isClient ? "text-blue-600" : "text-indigo-600")}>
              R$ {Number(contract.valor_atual).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Gatilho de Bilheteria para Produtores */}
        {isProducer && contract.status === 'PAID' && (
          <Card className="p-6 bg-purple-50 border-2 border-purple-100 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-200">
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-purple-900">Vender Ingressos?</h4>
                <p className="text-xs text-purple-700 font-medium">Ative a bilheteria automática para este evento agora.</p>
              </div>
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black px-8 h-14 shadow-xl shadow-purple-100 w-full md:w-auto">
              Ativar Bilheteria DUSHOW
            </Button>
          </Card>
        )}

        {canRelease && (
          <Card className="p-6 bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-emerald-900">Confirmar Realização</h4>
                <p className="text-xs text-emerald-700 font-medium">Libere o pagamento seguro ao artista.</p>
              </div>
            </div>
            <Button onClick={handleReleaseFunds} disabled={isReleasing} className="bg-emerald-600 rounded-2xl font-black px-8 h-14">
              {isReleasing ? <Loader2 className="animate-spin" /> : "Liberar Pagamento"}
            </Button>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1"><User className="w-3 h-3" /> {isClient ? "Artista" : "Contratante"}</Label>
              <p className="font-bold text-slate-900 text-lg">{isClient ? contract.pro?.full_name : contract.client?.full_name}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1"><Calendar className="w-3 h-3" /> Data</Label>
              <p className="font-bold text-slate-900 text-lg">{new Date(contract.data_evento).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1"><MapPin className="w-3 h-3" /> Local</Label>
              <p className="font-bold text-slate-900 text-lg">{contract.event_location || "A definir"}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Garantia</Label>
              <p className="text-sm text-slate-500 font-medium">Contrato protegido pelo sistema de Escrow DUSHOW.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ContractDetails;