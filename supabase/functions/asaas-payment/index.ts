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

    // SECURITY: Use user.id from JWT
    const profileId = user.id;
    const { contractId, paymentMethodId } = await req.json()

    const { data: contract } = await supabaseClient
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single()

    if (!contract) throw new Error("Contrato não localizado.");

    // VALIDAÇÕES CRÍTICAS
    if (contract.status !== 'ASSINADO') throw new Error("Pagamento proibido: Contrato não está assinado.");
    if (contract.contratante_profile_id === contract.profissional_profile_id) {
      throw new Error("Fraude detectada: Pagador e Recebedor são o mesmo perfil.");
    }
    if (contract.contratante_profile_id !== profileId) throw new Error("Apenas o contratante pode pagar.");

    // --- LÓGICA DE COBRANÇA ASAAS AQUI ---
    // ... (Sucesso na cobrança simulado)

    // Atualizar para PAGO e registrar no Ledger
    await supabaseClient.from('contracts').update({ status: 'PAGO' }).eq('id', contractId);
    
    await supabaseClient.from('financial_ledger').insert({
      contract_id: contractId,
      user_id: profileId,
      amount: -contract.valor_atual,
      type: 'DEBIT',
      description: `Pagamento confirmado: ${contract.event_name}`
    });

    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})