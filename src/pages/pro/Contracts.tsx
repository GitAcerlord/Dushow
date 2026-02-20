"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, MapPin, DollarSign, CheckCircle2, XCircle, Clock, Loader2, FileText
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

const normalizeStatus = (raw: unknown) => {
  const status = String(raw || "").toUpperCase();
  if (!status) return "PROPOSTO";
  if (["PROPOSTA_ENVIADA", "PENDING", "PENDENTE"].includes(status)) return "PROPOSTO";
  if (["SIGNED", "ASSINADO", "ACEITO", "ACCEPTED"].includes(status)) return "AGUARDANDO_PAGAMENTO";
  if (["PAID", "PAGO"].includes(status)) return "PAGO_ESCROW";
  if (status === "COMPLETED") return "CONCLUIDO";
  if (["REJEITADO", "REFUNDED", "REJECTED", "CANCELED", "CANCELLED"].includes(status)) return "CANCELADO";
  return status;
};

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    PROPOSTO: "Proposta enviada",
    CONTRAPROPOSTA: "Contraproposta",
    AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
    PAGO_ESCROW: "Pago em escrow",
    EM_EXECUCAO: "Em execucao",
    CONCLUIDO: "Concluido",
    LIBERADO_FINANCEIRO: "Financeiro liberado",
    EM_MEDIACAO: "Em mediacao",
    CANCELADO: "Cancelado",
  };
  return map[status] || status;
};

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

      let rows: any[] = [];

      const modern = await supabase
        .from('contracts')
        .select('*')
        .eq('profissional_profile_id', user.id)
        .order('created_at', { ascending: false });

      if (!modern.error) {
        rows = modern.data || [];
      } else {
        const legacy = await supabase
          .from('contracts')
          .select('*')
          .eq('pro_id', user.id)
          .order('created_at', { ascending: false });
        if (legacy.error) throw legacy.error;
        rows = legacy.data || [];
      }

      const clientIds = Array.from(
        new Set(
          rows
            .map((row) => row.contratante_profile_id || row.client_id)
            .filter(Boolean),
        ),
      ) as string[];

      const { data: clients } = clientIds.length > 0
        ? await supabase.from('profiles').select('id, full_name, avatar_url').in('id', clientIds)
        : { data: [] as any[] };

      const clientMap = new Map((clients || []).map((client: any) => [client.id, client]));

      const normalizedRows = rows.map((row) => {
          const clientId = row.contratante_profile_id || row.client_id;
          return {
            ...row,
            status: normalizeStatus(row.status_master || row.status || row.status_v1),
            data_evento: row.data_evento || row.event_date || null,
            valor_atual: row.valor_atual ?? row.value ?? 0,
            client: clientMap.get(clientId) || null,
          };
        });

      setContracts(normalizedRows);
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
        body: { contractId: id, action: action }
      });

      if (error) throw error;
      showSuccess(`Contrato atualizado!`);
      fetchContracts();
    } catch (error: any) {
      showError(error.message || "Erro ao processar contrato.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-[#2D1B69]" /></div>;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-[#2D1B69]">Meus Contratos</h1>
        <p className="text-slate-500">Gestão de propostas e shows confirmados.</p>
      </div>

      <div className="grid gap-6">
        {contracts.length === 0 ? (
          <Card className="p-12 text-center text-slate-400 font-medium border-dashed border-2 rounded-[2rem]">
            Nenhum contrato encontrado.
          </Card>
        ) : (
          contracts.map((contract) => (
            <Card key={contract.id} className="p-6 border-none shadow-sm bg-white flex flex-col md:flex-row gap-6 items-start md:items-center rounded-[2.5rem] hover:shadow-md transition-all">
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#2D1B69]">{contract.event_name}</h3>
                  <Badge className={cn(
                    "uppercase text-[10px] font-black px-3 py-1 rounded-full",
                    contract.status === 'CONCLUIDO' || contract.status === 'LIBERADO_FINANCEIRO' ? 'bg-emerald-500 text-white' : 
                    contract.status === 'AGUARDANDO_PAGAMENTO' ? 'bg-[#FFB703] text-[#2D1B69]' :
                    contract.status === 'CANCELADO' ? 'bg-red-500 text-white' : 
                    contract.status === 'PAGO_ESCROW' ? 'bg-[#2D1B69] text-white' : 'bg-slate-100 text-slate-500'
                  )}>
                    {statusLabel(contract.status)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-500 font-medium">
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-[#2D1B69]" /> {contract.data_evento ? new Date(contract.data_evento).toLocaleDateString() : "Data nao definida"}</div>
                  <div className="flex items-center gap-2 font-black text-[#2D1B69]"><DollarSign className="w-4 h-4" /> R$ {Number(contract.valor_atual).toLocaleString('pt-BR')}</div>
                </div>
              </div>

              <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
                {(contract.status === 'PROPOSTO' || contract.status === 'CONTRAPROPOSTA') && (
                  <>
                    <Button 
                      disabled={processingId === contract.id}
                      onClick={() => handleAction(contract.id, 'ACCEPT')} 
                      className="bg-[#2D1B69] hover:bg-[#1a1040] text-white flex-1 rounded-xl font-bold"
                    >
                      {processingId === contract.id ? <Loader2 className="animate-spin" /> : "Aceitar"}
                    </Button>
                    <Button 
                      disabled={processingId === contract.id}
                      onClick={() => handleAction(contract.id, 'REJECT')} 
                      variant="outline" 
                      className="text-red-600 border-red-100 flex-1 rounded-xl font-bold"
                    >
                      Rejeitar
                    </Button>
                  </>
                )}
                <Button variant="ghost" asChild className="text-[#2D1B69] hover:bg-purple-50 gap-2 flex-1 rounded-xl font-bold">
                  <Link to={`/app/contracts/${contract.id}`}><FileText className="w-4 h-4" /> Detalhes</Link>
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
