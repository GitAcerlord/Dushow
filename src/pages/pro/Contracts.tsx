"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, MapPin, DollarSign, CheckCircle2, XCircle, Clock, Loader2, FileText
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

const ProContracts = () => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

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

  const handleAction = async (id: string, action: string) => {
    setProcessingId(id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");
      
      const { data, error } = await supabase.functions.invoke('contract-state-machine', {
        body: { 
          contractId: id, 
          action: action, 
          userId: user.id 
        }
      });

      // Tratamento de erro detalhado para FunctionsHttpError
      if (error) {
        const errorBody = await error.context?.json();
        throw new Error(errorBody?.error || error.message);
      }

      if (data?.error) throw new Error(data.error);

      showSuccess(`Contrato atualizado para: ${data.status}`);
      fetchContracts();
    } catch (error: any) {
      console.error("Action Error:", error);
      showError(error.message || "Erro ao processar contrato.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Meus Contratos</h1>
        <p className="text-slate-500">Gestão governada pelo backend com auditoria financeira.</p>
      </div>

      <div className="grid gap-6">
        {contracts.length === 0 ? (
          <Card className="p-12 text-center text-slate-400 font-medium border-dashed border-2">
            Nenhum contrato encontrado.
          </Card>
        ) : (
          contracts.map((contract) => (
            <Card key={contract.id} className="p-6 border-none shadow-sm bg-white flex flex-col md:flex-row gap-6 items-start md:items-center rounded-[2rem]">
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="w-10 h-10 border border-slate-100">
                      <AvatarImage src={contract.profiles?.avatar_url} />
                      <AvatarFallback>{contract.profiles?.full_name?.[0] || 'C'}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold text-slate-900 truncate">{contract.event_name}</h3>
                      <p className="text-xs text-slate-500 font-medium truncate">{contract.profiles?.full_name || 'Contratante não informado'}</p>
                    </div>
                  </div>
                  <Badge className={cn(
                    "uppercase text-[10px] font-bold px-3 py-1 rounded-full",
                    contract.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 
                    contract.status === 'ACCEPTED' ? 'bg-blue-500 text-white' :
                    contract.status === 'REJECTED' ? 'bg-red-500 text-white' : 
                    contract.status === 'PAID' ? 'bg-indigo-500 text-white' : 'bg-amber-500 text-white'
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
                {(contract.status === 'CREATED' || contract.status === 'PENDING') && (
                  <>
                    <Button 
                      disabled={processingId === contract.id}
                      onClick={() => handleAction(contract.id, 'ACCEPT')} 
                      className="bg-indigo-600 flex-1 rounded-xl"
                    >
                      {processingId === contract.id ? <Loader2 className="animate-spin" /> : "Aceitar"}
                    </Button>
                    <Button 
                      disabled={processingId === contract.id}
                      onClick={() => handleAction(contract.id, 'REJECT')} 
                      variant="outline" 
                      className="text-red-600 border-red-100 flex-1 rounded-xl"
                    >
                      Rejeitar
                    </Button>
                  </>
                )}
                {contract.status === 'PAID' && (
                  <Button 
                    disabled={processingId === contract.id}
                    onClick={() => handleAction(contract.id, 'COMPLETE')} 
                    className="bg-emerald-600 flex-1 rounded-xl"
                  >
                    Concluir Show & Liberar Saldo
                  </Button>
                )}
                <Button variant="ghost" asChild className="text-indigo-600 gap-2 flex-1 rounded-xl">
                  <Link to={`/pro/contracts/${contract.id}`}><FileText className="w-4 h-4" /> Detalhes</Link>
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ProContracts;
