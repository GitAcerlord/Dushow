"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  FileText, Loader2, ArrowLeft, DollarSign, MessageSquare, CheckCircle2, 
  XCircle, History, Clock, ShieldCheck, PenTool, User, Briefcase, MapPin
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { getSafeImageUrl } from '@/utils/url-validator';

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
        client:profiles!contracts_client_id_fkey(*),
        pro:profiles!contracts_pro_id_fkey(*),
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
  const canAccept = contract.status === 'PENDING' && contract.current_version?.created_by_id !== user?.id;
  const canSign = contract.status === 'ACCEPTED' && !hasSigned;

  // Perfil da outra parte para visualização
  const otherParty = userRole === 'PRO' ? contract.client : contract.pro;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-slate-500 font-bold">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <div className="flex items-center gap-3">
          <Badge className={cn(
            "px-4 py-1.5 rounded-full uppercase tracking-widest font-bold",
            contract.status === 'SIGNED' ? 'bg-indigo-600 text-white' : 
            contract.status === 'ACCEPTED' ? 'bg-blue-500 text-white' :
            contract.status === 'PENDING' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'
          )}>
            {contract.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-8 md:p-12 border-none shadow-2xl bg-white rounded-[2.5rem] space-y-10 relative overflow-hidden">
            <div className="flex items-center gap-4 border-b pb-8">
              <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase">Contrato de Prestação de Serviços</h2>
                <p className="text-xs text-slate-400">ID: {contract.id.split('-')[0]}</p>
              </div>
            </div>

            <div className="space-y-8 text-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                      <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1 mb-2">
                        <Briefcase className="w-3 h-3" /> Contratante (Clique para ver perfil)
                      </Label>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={getSafeImageUrl(contract.client?.avatar_url, '')} />
                          <AvatarFallback>{contract.client?.full_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <p className="font-bold text-slate-900">{contract.client?.full_name}</p>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="rounded-[2rem] max-w-md">
                    <DialogHeader>
                      <DialogTitle>Perfil do Contratante</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4 text-center">
                      <Avatar className="w-24 h-24 mx-auto border-4 border-white shadow-lg">
                        <AvatarImage src={getSafeImageUrl(contract.client?.avatar_url, '')} />
                        <AvatarFallback>{contract.client?.full_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-black text-slate-900">{contract.client?.full_name}</h3>
                        <p className="text-sm text-slate-500 flex items-center justify-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {contract.client?.location || "Local não informado"}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl text-sm text-slate-600 text-left">
                        <p className="font-bold text-[10px] uppercase text-slate-400 mb-2">Sobre</p>
                        {contract.client?.bio || "Este contratante ainda não adicionou uma biografia."}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1 mb-2">
                    <User className="w-3 h-3" /> Artista
                  </Label>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={getSafeImageUrl(contract.pro?.avatar_url, '')} />
                      <AvatarFallback>{contract.pro?.full_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <p className="font-bold text-slate-900">{contract.pro?.full_name}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                <div className="p-6 bg-slate-50 rounded-2xl text-sm leading-relaxed text-slate-600 min-h-[150px] border border-slate-100">
                  {contract.current_version?.terms || "Os termos padrão da plataforma DUSHOW se aplicam a este contrato."}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {!isLocked && (
            <Card className="p-8 border-none shadow-xl bg-white rounded-[2rem] space-y-6 sticky top-24">
              <h3 className="font-black text-slate-900 text-lg">Ações Disponíveis</h3>
              
              {canAccept && (
                <Button 
                  onClick={() => handleAction('ACCEPT')} 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl gap-2 font-bold"
                >
                  <CheckCircle2 className="w-4 h-4" /> Aceitar Proposta
                </Button>
              )}

              {canSign && (
                <Button 
                  onClick={() => handleAction('SIGN')} 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 h-14 rounded-xl gap-2 font-black text-lg shadow-lg"
                >
                  <PenTool className="w-5 h-5" /> Assinar Contrato
                </Button>
              )}

              {!hasSigned && (
                <Button 
                  onClick={() => setIsNegotiating(true)} 
                  variant="outline"
                  className="w-full border-slate-200 text-slate-600 h-12 rounded-xl gap-2 font-bold"
                >
                  <MessageSquare className="w-4 h-4" /> Fazer Contraproposta
                </Button>
              )}

              <Button 
                onClick={() => handleAction('CANCEL')} 
                variant="ghost"
                className="w-full text-red-500 hover:bg-red-50 h-12 rounded-xl gap-2 font-bold"
              >
                <XCircle className="w-4 h-4" /> Cancelar Negociação
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractDetails;