import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')
const ASAAS_URL = 'https://www.asaas.com/api/v3'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { contractId } = await req.json()
    if (!contractId) throw new Error('contractId é requerido')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: contract, error: cErr } = await supabase.from('contracts').select('*').eq('id', contractId).maybeSingle()
    if (cErr) throw cErr
    if (!contract) throw new Error('Contrato não encontrado')

    const paymentId = contract.asaas_payment_id
    const amount = Number(contract.artist_net || contract.value || 0)

    if (!paymentId) throw new Error('Contrato sem referência de pagamento Asaas')

    // Chamada ao Asaas para estorno — exemplo, a API real pode variar
    const refundResp = await fetch(`${ASAAS_URL}/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY || ''
      },
      body: JSON.stringify({ value: amount, description: `Reembolso contrato ${contractId}` })
    })

    const refundData = await refundResp.json().catch(() => null)
    if (!refundResp.ok) {
      const msg = refundData?.errors?.[0]?.description || refundData?.message || 'Erro no gateway Asaas'
      throw new Error(msg)
    }

    const refundId = refundData?.id || refundData?.refundId || null

    // Atualiza withdrawals/ledger/contract
    await supabase.from('contracts').update({ status: 'REFUNDED', refund_id: refundId, refunded_at: new Date().toISOString() }).eq('id', contractId)

    // Inserir entrada no ledger de reembolso (caso não exista)
    await supabase.from('financial_ledger').insert({
      contract_id: contractId,
      user_id: contract.client_id,
      amount: Number(amount),
      type: 'CREDIT',
      description: `Reembolso via Asaas - refundId: ${refundId}`
    })

    // Chamar RPC que decrements pending balance do artista (se existir)
    try {
      await supabase.rpc('decrement_pending_balance', { user_id: contract.pro_id, amount })
    } catch (rpcErr) {
      console.error('RPC decrement_pending_balance erro:', rpcErr?.message || rpcErr)
    }

    return new Response(JSON.stringify({ success: true, refundId }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error: any) {
    console.error('[refund-with-asaas] erro:', error?.message || error)
    return new Response(JSON.stringify({ error: error?.message || 'internal error' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
