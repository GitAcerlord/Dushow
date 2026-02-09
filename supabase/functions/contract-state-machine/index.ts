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
    
    const { data: contract } = await supabaseClient
      .from('contracts')
      .select('*, pro:profiles!contracts_pro_id_fkey(*)')
      .eq('id', contractId)
      .single()

    if (action === 'COMPLETE_EVENT') {
      // Apenas o CLIENTE pode liberar o dinheiro
      if (contract.client_id !== userId) throw new Error("Apenas o contratante pode liberar o pagamento.");
      if (contract.status !== 'PAID') throw new Error("O contrato ainda não foi pago.");

      const feePercentage = 0.15; // Simplificado, ideal buscar do plano
      const artistNet = Number(contract.value) * (1 - feePercentage);

      // MOVER SALDO: Tira do pendente e coloca no disponível
      const { error: rpcError } = await supabaseClient.rpc('release_artist_funds', {
        artist_id: contract.pro_id,
        amount: artistNet
      });

      if (rpcError) throw rpcError;

      await supabaseClient.from('contracts').update({ status: 'COMPLETED' }).eq('id', contractId);
      
      return new Response(JSON.stringify({ success: true, status: 'COMPLETED' }), { headers: corsHeaders });
    }

    // ... outras ações (ACCEPT, REJECT, etc)
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
  }
})