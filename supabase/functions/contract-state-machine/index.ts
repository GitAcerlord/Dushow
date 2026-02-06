import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { contractId, action, userId } = await req.json()
    console.log(`[contract-state-machine] Action: ${action} | Contract: ${contractId}`);

    const { data: contract, error: fetchError } = await supabaseClient
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single()

    if (fetchError || !contract) throw new Error("Contrato não localizado.");

    let nextStatus = contract.status;
    let ledgerStatus: 'PREVISTO' | 'CONFIRMADO' | 'RECEBIDO' | 'CANCELADO' | null = null;

    // MÁQUINA DE ESTADOS
    switch (action) {
      case 'ACCEPT':
        if (userId !== contract.pro_id) throw new Error("Apenas o profissional pode aceitar.");
        nextStatus = 'ACCEPTED';
        ledgerStatus = 'PREVISTO';
        break;
      case 'SIGN':
        nextStatus = 'SIGNED';
        ledgerStatus = 'CONFIRMADO';
        break;
      case 'REJECT':
        nextStatus = 'REJECTED';
        break;
      case 'CANCEL':
        nextStatus = 'CANCELED';
        ledgerStatus = 'CANCELADO';
        break;
      case 'COMPLETE':
        nextStatus = 'COMPLETED';
        ledgerStatus = 'RECEBIDO';
        break;
      default:
        throw new Error("Ação inválida.");
    }

    // 1. Atualizar Status do Contrato
    const { error: updateError } = await supabaseClient
      .from('contracts')
      .update({ status: nextStatus })
      .eq('id', contractId);

    if (updateError) throw updateError;

    // 2. Sincronização Financeira Automática (Upsert)
    if (ledgerStatus) {
      const { error: ledgerError } = await supabaseClient
        .from('financial_ledger')
        .upsert({
          contract_id: contractId,
          user_id: contract.pro_id,
          amount: Number(contract.value),
          status: ledgerStatus,
          description: `Evento: ${contract.event_name}`,
          event_date: contract.event_date
        }, { onConflict: 'contract_id' });

      if (ledgerError) console.error("[ledger-sync] Erro:", ledgerError);
    }

    return new Response(JSON.stringify({ success: true, status: nextStatus }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
  }
})