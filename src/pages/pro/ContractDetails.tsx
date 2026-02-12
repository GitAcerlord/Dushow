"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Loader2, 
  ArrowLeft, 
  CheckCircle2, 
  FileText, 
  MapPin, 
  Calendar, 
  DollarSign, 
  ShieldCheck, 
  AlertCircle, 
  User, 
  MessageSquare,
  ArrowRightLeft
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
  const [isProcessing, setIsProcessing] = useState(false);

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
          client:profiles!contracts_contratante_profile_id_fkey(full_name, avatar_url), 
          pro:profiles!contracts_profissional_profile_id_fkey(full_name, avatar_url)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setContract(data);
    } catch (error: any) {
      showError("Falha ao carregar detalhes do contrato.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (action: string) => {
    setIsProcessing(true);
    try {
      // Usamos a Edge Function para gerenciar a máquina de estados do contrato
      const { error } = await supabase.functions.invoke('contract-state-machine', {
        body: { contractId: id, action: action }
      });

      if (error) throw error;
      
      showSuccess(`Status atualizado: ${action}`);
      fetchData();
    } catch (e: any) {
      showError("Erro ao processar transição de status.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#2D1B69] w-10 h-10" /></div>;
  if (!contract) return <div className="p-20 text-center">Contrato não localizado.</div>;

  // Prevenção de NaN: Garantimos que o valor seja tratado como número sempre
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
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cachê Final</p>
            <p className="text-4xl font-black text-[#2D1B69]">
              R$ {displayValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Pipeline de Ações Baseado no Status */}
        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <ArrowRightLeft className="w-3 h-3" /> Ações do Contrato
          </h4>
          
          <div className="flex flex-wrap gap-4">
            {contract.status === 'PENDING' && isPro && (
              <>
                <Button onClick={() => handleStatusChange('ACCEPT')} disabled={isProcessing} className="bg-[#2D1B69] h-12 px-8 rounded-xl font-bold">Aceitar Proposta</Button>
                <Button variant="outline" onClick={() => handleStatusChange('REJECT')} disabled={isProcessing} className="h-12 px-8 rounded-xl font-bold border-red-100 text-red-600 hover:bg-red-50">Recusar</Button>
              </>
            )}
            
            {contract.status === 'ACEITO' && isClient && (
              <Button onClick={() => navigate('/app/checkout', { state: { artist: contract.pro, contractId: contract.id } })} className="bg-emerald-600 h-14 px-10 rounded-2xl font-black shadow-xl shadow-emerald-100">Efetuar Pagamento via Asaas</Button>
            )}

            {contract.status === 'PAGO' && (
              <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-2xl w-full border border-emerald-100">
                <ShieldCheck className="w-6 h-6" />
                <p className="text-xs font-bold uppercase">Pagamento confirmado e seguro no Escrow. O repasse será feito após o evento.</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-8">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><User className="w-3 h-3" /> {isPro ? 'Contratante' : 'Profissional'}</Label>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                <img src={isPro ? contract.client?.avatar_url : contract.pro?.avatar_url} className="w-10 h-10 rounded-xl object-cover" />
                <p className="font-black text-[#2D1B69]">{isPro ? contract.client?.full_name : contract.pro?.full_name}</p>
              </div>
            </div>
            
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> Data do Show</Label>
              <p className="text-xl font-bold text-slate-700">{new Date(contract.data_evento).toLocaleDateString('pt-BR', { dateStyle: 'full' })}</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> Localização</Label>
              <p className="text-xl font-bold text-slate-700">{contract.event_location || "Local a definir"}</p>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Detalhes Adicionais</Label>
              <p className="text-sm text-slate-500 leading-relaxed italic">"{contract.contract_text || "Sem observações."}"</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ContractDetails;