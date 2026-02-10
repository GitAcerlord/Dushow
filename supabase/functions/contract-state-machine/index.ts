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
    if (authError || !user) throw new Error("Não autorizado")

    const { contractId, action, newValue, profileId } = await req.json()
    
    const { data: contract } = await supabaseClient
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single()

    if (!contract) throw new Error("Contrato não encontrado.")

    const isContratante = contract.contratante_profile_id === profileId;
    const isProfissional = contract.profissional_profile_id === profileId;
    const oldStatus = contract.status;

    let newStatus = oldStatus;

    // REGRAS DE TRANSIÇÃO
    if (action === 'ACCEPT' && isProfissional) newStatus = 'ACEITO';
    if (action === 'REJECT' && isProfissional) newStatus = 'REJEITADO';
    if (action === 'SIGN' && isContratante) newStatus = 'ASSINADO';
    if (action === 'COUNTER_PROPOSAL' && isProfissional) {
      newStatus = 'CONTRAPROPOSTA';
    }

    // 1. Atualizar Contrato
    const { error: updateError } = await supabaseClient
      .from('contracts')
      .update({ 
        status: newStatus, 
        valor_atual: newValue || contract.valor_atual 
      })
      .eq('id', contractId);

    if (updateError) throw updateError;

    // 2. Registrar Histórico (Auditoria)
    await supabaseClient.from('contract_history').insert({
      contract_id: contractId,
      action: action,
      performed_by_profile_id: profileId,
      old_status: oldStatus,
      new_status: newStatus,
      old_value: contract.valor_atual,
      new_value: newValue || contract.valor_atual
    });

    return new Response(JSON.stringify({ success: true, status: newStatus }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})