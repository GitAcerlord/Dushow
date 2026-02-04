"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, MapPin, DollarSign, CheckCircle2, XCircle, Clock, Loader2, FileText, Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

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

  const handleAction = async (id: string, newStatus: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Atualizar Status do Contrato
      const { error: updateError } = await supabase
        .from('contracts')
        .update({ status: newStatus })
        .eq('id', id);

      if (updateError) throw updateError;

      // 2. Se concluído, dar XP (+100 XP por show)
      if (newStatus === 'COMPLETED' && user) {
        const { data: profile } = await supabase.from('profiles').select('xp_total').eq('id', user.id).single();
        await supabase.from('profiles').update({ xp_total: (profile?.xp_total || 0) + 100 }).eq('id', user.id);
        showSuccess("Evento concluído! +100 XP conquistados.");
      } else {
        showSuccess(`Contrato atualizado para ${newStatus}.`);
      }

      fetchContracts();
    } catch (error: any) {
      showError("Erro ao processar ação.");
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Meus Contratos</h1>
          <p className="text-slate-500">Acompanhe o fluxo desde a proposta até o cachê.</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
          <Zap className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-indigo-900">+100 XP por Show</span>
        </div>
      </div>

      <div className="grid gap-6">
        {contracts.map((contract) => (
          <Card key={contract.id} className="p-6 border-none shadow-sm bg-white flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">{contract.event_name}</h3>
                <Badge className={cn(
                  "uppercase text-[10px] font-bold",
                  contract.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 
                  contract.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 
                  contract.status === 'COMPLETED' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                )}>
                  {contract.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(contract.event_date).toLocaleDateString()}</div>
                <div className="flex items-center gap-2 font-bold text-indigo-600"><DollarSign className="w-4 h-4" /> R$ {Number(contract.value).toLocaleString('pt-BR')}</div>
              </div>
            </div>

            <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
              {contract.status === 'PENDING' && (
                <Button onClick={() => handleAction(contract.id, 'ACCEPTED')} className="bg-indigo-600 flex-1">Aceitar Proposta</Button>
              )}
              {contract.status === 'PAID' && (
                <Button onClick={() => handleAction(contract.id, 'COMPLETED')} className="bg-emerald-600 flex-1">Concluir Evento</Button>
              )}
              <Button variant="ghost" asChild className="text-indigo-600 gap-2 flex-1">
                <Link to={`/pro/contracts/${contract.id}`}><FileText className="w-4 h-4" /> Ver Contrato</Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProContracts;