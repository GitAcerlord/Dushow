"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, MapPin, DollarSign, CheckCircle2, XCircle, Clock, Loader2, FileText
} from "lucide-react";
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from "@/utils/toast";

const ProContracts = () => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('contracts')
        .select('*, profiles!contracts_client_id_fkey(full_name, avatar_url)')
        .eq('pro_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      showSuccess(`Contrato ${status === 'PAID' ? 'aceito' : 'cancelado'} com sucesso!`);
      fetchContracts();
    } catch (error: any) {
      showError("Erro ao atualizar contrato.");
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Meus Contratos</h1>
        <p className="text-slate-500 mt-1">Gerencie suas propostas e eventos confirmados.</p>
      </div>

      <div className="grid gap-6">
        {contracts.length === 0 ? (
          <Card className="p-12 text-center text-slate-400">Você ainda não possui contratos.</Card>
        ) : (
          contracts.map((contract) => (
            <Card key={contract.id} className="p-6 border-none shadow-sm bg-white flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">{contract.event_name}</h3>
                  <Badge className={cn(
                    "uppercase text-[10px] font-bold",
                    contract.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 
                    contract.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                  )}>
                    {contract.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(contract.event_date).toLocaleDateString()}</div>
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {new Date(contract.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {contract.event_location || 'Local a definir'}</div>
                  <div className="flex items-center gap-2 font-bold text-indigo-600"><DollarSign className="w-4 h-4" /> R$ {Number(contract.value).toLocaleString('pt-BR')}</div>
                </div>

                <div className="pt-4 border-t flex items-center gap-3">
                  <div className="text-xs text-slate-400 uppercase font-bold">Contratante:</div>
                  <div className="flex items-center gap-2">
                    <img src={contract.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contract.profiles?.full_name}`} className="w-6 h-6 rounded-full" />
                    <span className="text-sm font-bold text-slate-700">{contract.profiles?.full_name}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
                {contract.status === 'PENDING' && (
                  <>
                    <Button onClick={() => updateStatus(contract.id, 'PAID')} className="bg-emerald-600 hover:bg-emerald-700 flex-1">Aceitar</Button>
                    <Button onClick={() => updateStatus(contract.id, 'CANCELLED')} variant="outline" className="text-red-600 border-red-100 hover:bg-red-50 flex-1">Recusar</Button>
                  </>
                )}
                <Button variant="ghost" className="text-indigo-600 gap-2 flex-1"><FileText className="w-4 h-4" /> Detalhes</Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ProContracts;