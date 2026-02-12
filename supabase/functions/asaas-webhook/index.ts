import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const WEBHOOK_SECRET = Deno.env.get('ASAAS_WEBHOOK_SECRET') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-asaas-signature',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    // Optional basic secret verification
    if (WEBHOOK_SECRET) {
      const sig = req.headers.get('x-asaas-signature') || req.headers.get('x-signature') || ''
      if (!sig || sig !== WEBHOOK_SECRET) {
        return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const payload = await req.json().catch(() => null)
    if (!payload) throw new Error('Invalid payload')

    // Tentar extrair informações em formatos possíveis do Asaas
    const payment = payload.payment || payload.transfer || payload.data || payload
    const paymentId = payment?.id || payload?.id || null
    const rawStatus = (payment?.status || payload?.status || payload?.event || '').toString()
    const status = rawStatus.toUpperCase()
    const value = Number(payment?.value || payment?.amount || payment?.originalValue || 0)
    const customerId = payment?.customer || payment?.customerId || payment?.customer_id || null

    // Mapear status para o nosso sistema
    let mappedStatus = 'PENDING'
    if (/CONFIRM|RECEIV|PAID|COMPLET|SETTLED/.test(status)) mappedStatus = 'COMPLETED'
    else if (/CANCEL|FAIL|REJECT|REFUND/.test(status)) mappedStatus = 'FAILED'
    else mappedStatus = status || 'PENDING'

    // 1) Atualizar financial_ledger entries que tenham o external_payment_id
    if (paymentId) {
      await supabase.from('financial_ledger').update({ confirmed: true }).eq('external_payment_id', paymentId)
    }

    // 2) Tentar atualizar withdrawals vinculando pelo asaas id
    if (paymentId) {
      const { data: updatedById, error: updErr } = await supabase.from('withdrawals').update({ status: mappedStatus, asaas_payment_id: paymentId }).eq('asaas_payment_id', paymentId)
      // se já havia retirada atrelada, respondemos OK
      if (updErr) console.error('Erro ao atualizar withdrawal por id:', updErr.message)
      if (updatedById && updatedById.length > 0) {
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // 3) Se não encontramos por id, tentar casar por customer/valor/recentes
    let withdrawalToUpdate: any = null
    if (customerId) {
      const { data: profile } = await supabase.from('profiles').select('id').eq('asaas_customer_id', customerId).maybeSingle()
      if (profile?.id) {
        const { data: candidates } = await supabase.from('withdrawals')
          .select('*')
          .eq('user_id', profile.id)
          .eq('status', 'PENDING')
          .order('created_at', { ascending: false })
          .limit(10)

        if (candidates && candidates.length > 0) {
          withdrawalToUpdate = candidates.find((w: any) => Math.abs(Number(w.amount) - value) < 0.5) || candidates[0]
        }
      }
    }

    // 4) fallback: tentar encontrar por valor e status pendente geral
    if (!withdrawalToUpdate && value > 0) {
      const { data: candidates } = await supabase.from('withdrawals')
        .select('*')
        .eq('status', 'PENDING')
        .lte('created_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(20)

      if (candidates && candidates.length > 0) {
        withdrawalToUpdate = candidates.find((w: any) => Math.abs(Number(w.amount) - value) < 0.5) || candidates[0]
      }
    }

    if (withdrawalToUpdate) {
      await supabase.from('withdrawals').update({ status: mappedStatus, asaas_payment_id: paymentId }).eq('id', withdrawalToUpdate.id)

      // também garantir que o ledger associado ganhe external_payment_id & confirmado
      await supabase.from('financial_ledger')
        .update({ external_payment_id: paymentId, confirmed: true })
        .eq('user_id', withdrawalToUpdate.user_id)
        .eq('amount', -Math.abs(Number(withdrawalToUpdate.amount)))
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error: any) {
    console.error('[asaas-webhook] erro:', error?.message || error)
    return new Response(JSON.stringify({ error: error?.message || 'internal error' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
