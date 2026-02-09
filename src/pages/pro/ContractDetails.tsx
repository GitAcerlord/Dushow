"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, CheckCircle2, FileText, MapPin, Calendar, DollarSign, ShieldCheck } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from "@/utils/toast";

const ContractDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isReleasing, setIsReleasing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    setUser(authUser);

    const { data } = await supabase
      .from('contracts')
      .select('*, client:profiles!contracts_client_id_fkey(*), pro:profiles!contracts_pro_id_fkey(*)')
      .eq('id', id)
      .single();

    setContract(data);
    setLoading(false);
  };

  const handleReleaseFunds = async () => {
    setIsReleasing(true);
    try {
      const { data, error } = await supabase.functions.invoke('contract-state-machine', {
        body: { contractId: id, action: 'COMPLETE_EVENT', userId: user.id }
      });

      if (error) throw error;
      showSuccess("Evento confirmado! O pagamento foi liberado para o artista.");
      fetchData();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsReleasing(false);
    }
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  const isClient = user?.id === contract.client_id;
  const canRelease = isClient && contract.status === 'PAID';

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-slate-500 font-bold">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Button>

      <Card className="p-10 border-none shadow-2xl bg-white rounded-[3rem] space-y-8">
        <div className="flex justify-between items-start border-b pb-8">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white"><FileText /></div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase">{contract.event_name}</h2>
              <p className="text-xs text-slate-400">Status: <Badge className="ml-2">{contract.status}</Badge></p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase">Valor do Contrato</p>
            <p className="text-3xl font-black text-indigo-600">R$ {Number(contract.value).toLocaleString('pt-BR')}</p>
          </div>
        </div>

        {canRelease && (
          <Card className="p-6 bg-emerald-50 border-none rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-emerald-600 w-8 h-8" />
              <div>
                <h4 className="font-black text-emerald-900">O evento já aconteceu?</h4>
                <p className="text-xs text-emerald-700">Confirme a realização para liberar o cachê do artista.</p>
              </div>
            </div>
            <Button 
              onClick={handleReleaseFunds} 
              disabled={isReleasing}
              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl font-black px-8 h-12 shadow-lg shadow-emerald-100"
            >
              {isReleasing ? <Loader2 className="animate-spin" /> : "Confirmar & Liberar Pagamento"}
            </Button>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-8 text-sm">
          <div>
            <Label className="text-[10px] font-black uppercase text-slate-400">Artista</Label>
            <p className="font-bold text-slate-900">{contract.pro?.full_name}</p>
          </div>
          <div>
            <Label className="text-[10px] font-black uppercase text-slate-400">Data</Label>
            <p className="font-bold text-slate-900">{new Date(contract.event_date).toLocaleDateString()}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ContractDetails;