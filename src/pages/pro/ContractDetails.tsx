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
  FileText, Loader2, ArrowLeft, DollarSign, MessageSquare, CheckCircle2, 
  XCircle, CreditCard, History, Clock, ShieldCheck, PenTool, AlertTriangle
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

const ContractDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [signatures, setSignatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");

  // Form de contraproposta
  const [formData, setFormData] = useState({
    value: "",
    event_date: "",
    event_location: "",
    terms: ""
  });

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
      
      if (authUser) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', authUser.id).single();
        setUserRole(profile?.role || "");
      }
      
      await fetchData();
    };
    init();
  }, [id]);

  const fetchData = async () => {
    const { data: contractData } = await supabase
      .from('contracts')
      .select(`
        *,
        client:profiles!contracts_client_id_fkey(full_name, id, avatar_url),
        pro:profiles!contracts_pro_id_fkey(full_name, id, avatar_url),
        current_version:contract_versions!current_version_id(*)
      `)
      .eq('id', id)
      .single();

    if (contractData) {
      setContract(contractData);
      setFormData({
        value: contractData.current_version?.value || contractData.value,
        event_date: contractData.current_version?.event_date || contractData.event_date,
        event_location: contractData.current_version?.event_location || contractData.event_location,
        terms: contractData.current_version?.terms || ""
      });

      const { data: hist } = await supabase.from('contract_history').select('*').eq('contract_id', id).order('created_at', { ascending: false });
      setHistory(hist || []);

      const { data: sigs } = await supabase.from('contract_signatures').select('*').eq('contract_id', id);
      setSignatures(sigs || []);
    }
    setLoading(false);
  };

  const handleAction = async (action: string, payload: any = {}) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('contract-state-machine', {
        body: { contractId: id, action, userId: user.id, payload: { ...payload, role: userRole } }
      });

      if (error) throw error;
      showSuccess("Ação realizada com sucesso!");
      setIsNegotiating(false);
      await fetchData();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !contract) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  const hasSigned = signatures.some(s => s.user_id === user?.id);
  const isLocked = contract.status === 'SIGNED' || contract.status === 'COMPLETED' || contract.status === 'CANCELED';

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-slate-500 font-bold">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <Badge className={cn(
          "px-4 py-1.5 rounded-full uppercase tracking-widest font-bold",
          contract.status === 'SIGNED' ? 'bg-indigo-600 text-white' : 
          contract.status === 'ACCEPTED' ? 'bg-blue-500 text-white' :
          contract.status === 'PENDING' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'
        )}>
          {contract.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Documento do Contrato */}
          <Card className="p-8 md:p-12 border-none shadow-2xl bg-white rounded-[2.5rem] space-y-10 relative overflow-hidden">
            {isLocked && <div className="absolute top-10 right-10 rotate-12 border-4 border-indigo-600 text-indigo-600 px-6 py-2 font-black text-2xl opacity-20 uppercase">Documento Selado</div>}
            
            <div className="flex items-center gap-4 border-b pb-8">
              <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase">Contrato de Prestação de Serviços</h2>
                <p className="text-xs text-slate-400">Versão Ativa: {contract.current_version?.id.split('-')[0] || 'v1'}</p>
              </div>
            </div>

            <div className="space-y-8 text-slate-700">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <Label className="text-[10px] font-black uppercase text-slate-400">Contratante</Label>
                  <p className="font-bold text-slate-900">{contract.client?.full_name}</p>
                </div>
                <div>
                  <Label className="text-[10px] font-black uppercase text-slate-400">Artista</Label>
                  <p className="font-bold text-slate-900">{contract.pro?.full_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <Label className="text-[10px] font-black uppercase text-slate-400">Data do Evento</Label>
                  <p className="font-bold text-slate-900">{new Date(contract.event_date).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-[10px] font-black uppercase text-slate-400">Local</Label>
                  <p className="font-bold text-slate-900">{contract.event_location || 'A definir'}</p>
                </div>
              </div>

              <div className="pt-6 border-t">
                <Label className="text-[10px] font-black uppercase text-slate-400">Valor do Cachê</Label>
                <p className="text-4xl font-black text-indigo-600">R$ {Number(contract.value).toLocaleString('pt-BR')}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Termos e Condições</Label>
                <div className="p-4 bg-slate-50 rounded-2xl text-sm leading-relaxed text-slate-600 min-h-[100px]">
                  {contract.current_version?.terms || "Os termos padrão da plataforma DUSHOW se aplicam a este contrato."}
                </div>
              </div>
            </div>

            {/* Área de Assinaturas */}
            <div className="pt-10 border-t grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-slate-400">Assinatura Contratante</p>
                {signatures.find(s => s.user_role === 'CLIENT') ? (
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" /> Assinado Digitalmente
                  </div>
                ) : (
                  <div className="text-slate-300 text-sm italic">Aguardando...</div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-slate-400">Assinatura Artista</p>
                {signatures.find(s => s.user_role === 'PRO') ? (
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" /> Assinado Digitalmente
                  </div>
                ) : (
                  <div className="text-slate-300 text-sm italic">Aguardando...</div>
                )}
              </div>
            </div>
          </Card>

          {/* Timeline de Histórico */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              Linha do Tempo do Contrato
            </h3>
            <div className="space-y-4 relative before:absolute before:left-6 before:top-0 before:bottom-0 before:w-0.5 before:bg-slate-200">
              {history.map((item) => (
                <div key={item.id} className="relative pl-12">
                  <div className="absolute left-4 top-1 w-4 h-4 rounded-full bg-white border-4 border-indigo-600 z-10"></div>
                  <Card className="p-4 border-none shadow-sm bg-white rounded-2xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.action.replace('_', ' ')}</p>
                        <p className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{item.to_status}</Badge>
                    </div>
                    {item.action === 'COUNTER_PROPOSAL' && (
                      <div className="mt-2 p-2 bg-indigo-50 rounded-lg text-xs text-indigo-700">
                        Novo valor proposto: <strong>R$ {Number(item.metadata.value).toLocaleString('pt-BR')}</strong>
                      </div>
                    )}
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ações Laterais */}
        <div className="space-y-6">
          {!isLocked && (
            <Card className="p-8 border-none shadow-xl bg-white rounded-[2rem] space-y-6">
              <h3 className="font-black text-slate-900 text-lg">Ações</h3>
              
              {contract.status === 'PENDING' && (
                <Button 
                  onClick={() => handleAction('ACCEPT')} 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl gap-2 font-bold"
                >
                  <CheckCircle2 className="w-4 h-4" /> Aceitar Termos
                </Button>
              )}

              {contract.status === 'ACCEPTED' && !hasSigned && (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                    <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-[10px] text-amber-800 leading-relaxed">
                      Ao assinar, você concorda com os termos e o valor de <strong>R$ {Number(contract.value).toLocaleString('pt-BR')}</strong>. Esta ação é irreversível.
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleAction('SIGN')} 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 h-14 rounded-xl gap-2 font-black text-lg shadow-lg"
                  >
                    <PenTool className="w-5 h-5" /> Assinar Agora
                  </Button>
                </div>
              )}

              {!hasSigned && (
                <Button 
                  onClick={() => setIsNegotiating(true)} 
                  variant="outline"
                  className="w-full border-slate-200 text-slate-600 h-12 rounded-xl gap-2 font-bold"
                >
                  <MessageSquare className="w-4 h-4" /> Contraproposta
                </Button>
              )}

              <Button 
                onClick={() => handleAction('CANCEL')} 
                variant="ghost"
                className="w-full text-red-500 hover:bg-red-50 h-12 rounded-xl gap-2 font-bold"
              >
                <XCircle className="w-4 h-4" /> Cancelar
              </Button>
            </Card>
          )}

          {isNegotiating && (
            <Card className="p-8 border-none shadow-xl bg-slate-900 text-white rounded-[2rem] space-y-6">
              <h3 className="font-black flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-400" />
                Nova Versão
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-400">Novo Valor (R$)</Label>
                  <Input 
                    type="number" 
                    value={formData.value} 
                    onChange={(e) => setFormData({...formData, value: e.target.value})} 
                    className="h-12 bg-white/10 border-none rounded-xl text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-400">Data do Evento</Label>
                  <Input 
                    type="datetime-local" 
                    value={formData.event_date} 
                    onChange={(e) => setFormData({...formData, event_date: e.target.value})} 
                    className="h-12 bg-white/10 border-none rounded-xl text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-400">Termos Adicionais</Label>
                  <Textarea 
                    placeholder="Ex: Rider técnico, alimentação..." 
                    value={formData.terms} 
                    onChange={(e) => setFormData({...formData, terms: e.target.value})}
                    className="bg-white/10 border-none rounded-xl min-h-[100px] text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setIsNegotiating(false)} variant="ghost" className="flex-1 text-white">Cancelar</Button>
                  <Button onClick={() => handleAction('COUNTER_PROPOSAL', formData)} className="bg-indigo-600 flex-1 font-bold">Enviar</Button>
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