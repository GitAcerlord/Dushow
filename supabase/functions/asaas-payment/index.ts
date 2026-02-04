import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')
const ASAAS_URL = 'https://www.asaas.com/api/v3' // Use 'https://sandbox.asaas.com/api/v3' para testes

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { amount, description, customerEmail } = await req.json()

    // 1. Criar ou buscar cliente no ASAAS
    // 2. Criar cobrança (PIX/Boleto/Cartão)
    const response = await fetch(`${ASAAS_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY!
      },
      body: JSON.stringify({
        customer: 'customer_id_here', // Você deve buscar o ID do cliente antes
        billingType: 'PIX',
        value: amount,
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        description: description
      })
    })

    const data = await response.json()
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
  }
})