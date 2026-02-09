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

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) throw new Error("Unauthorized access")

    const body = await req.json()
    const { contractId, action } = body
    const payload = body.payload || {} // Fallback para payload vazio
    const userId = user.id
    
    const { data: contract, error: fetchError } = await supabaseClient
      .from('contracts')
      .select('*, current_version:contract_versions!current_version_id(*)')
      .eq('id', contractId)
      .single()

    if (fetchError || !contract) throw new Error("Contrato não localizado.");
    if (contract.client_id !== userId && contract.pro_id !== userId) throw new Error("Acesso negado.");

    let nextStatus = contract.status;
    let ledgerStatus: string | null = null;
    const oldStatus = contract.status;

    if (action === 'COUNTER_PROPOSAL') {
      if (contract.status === 'SIGNED' || contract.status === 'COMPLETED') throw new Error("Contrato assinado não pode ser alterado.");
      
      const { data: newVersion, error: vError } = await supabaseClient
        .from('contract_versions')
        .insert({
          contract_id: contractId,
          value: payload.value || contract.value,
          event_date: payload.event_date || contract.event_date,
          event_location: payload.event_location || contract.event_location,
          terms: payload.terms,
          created_by_id: userId,
          created_by_role: payload.role,
          is_active: true
        })
        .select().single();
      
      if (vError) throw vError;
      await supabaseClient.from('contracts').update({ current_version_id: newVersion.id, status: 'PENDING' }).eq('id', contractId);
      nextStatus = 'PENDING';
    } 
    else if (action === 'ACCEPT') {
      nextStatus = 'ACCEPTED';
      ledgerStatus = 'PREVISTO';
    }
    else if (action === 'SIGN') {
      const { error: sError } = await supabaseClient.from('contract_signatures').insert({
        contract_id: contractId,
        user_id: userId,
        user_role: payload.role || 'UNKNOWN',
        ip_address: req.headers.get('x-real-ip') || 'unknown'
      });
      if (sError) throw new Error("Você já assinou este contrato.");
      
      const { count } = await supabaseClient.from('contract_signatures').select('*', { count: 'exact', head: true }).eq('contract_id', contractId);
      if (count === 2) {
        nextStatus = 'SIGNED';
        ledgerStatus = 'CONFIRMADO';
      }
    }
    else if (action === 'COMPLETE') {
      nextStatus = 'COMPLETED';
      ledgerStatus = 'RECEBIDO';
    }

    if (nextStatus !== oldStatus) {
      await supabaseClient.from('contracts').update({ status: nextStatus }).eq('id', contractId);
    }

    await supabaseClient.from('contract_history').insert({
      contract_id: contractId,
      action: action,
      from_status: oldStatus,
      to_status: nextStatus,
      user_id: userId,
      metadata: payload
    });

    if (ledgerStatus) {
      await supabaseClient.from('financial_ledger').upsert({
        contract_id: contractId,
        user_id: contract.pro_id,
        amount: Number(contract.value),
        status: ledgerStatus,
        description: `Evento: ${contract.event_name}`,
        event_date: contract.event_date
      }, { onConflict: 'contract_id' });
    }

    return new Response(JSON.stringify({ success: true, status: nextStatus }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
  }
})