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
    
    const { data: contract, error: fetchError } = await supabaseClient
      .from('contracts')
      .select('*, pro:profiles!contracts_pro_id_fkey(*)')
      .eq('id', contractId)
      .single()

    if (fetchError || !contract) throw new Error("Contrato não localizado.");

    if (action === 'COMPLETE_EVENT') {
      // Segurança: Apenas o contratante pode liberar o dinheiro
      if (contract.client_id !== userId) throw new Error("Apenas o contratante pode liberar o pagamento.");
      if (contract.status !== 'PAID') throw new Error("O contrato ainda não foi pago ou já foi concluído.");

      const feePercentage = 0.15; // Idealmente buscar do plano do artista
      const artistNet = Number(contract.value) * (1 - feePercentage);

      // Chamada RPC com nomes de parâmetros explícitos
      const { error: rpcError } = await supabaseClient.rpc('release_artist_funds', {
        artist_id: contract.pro_id,
        amount: artistNet
      });

      if (rpcError) {
        console.error("[contract-state-machine] RPC Error:", rpcError);
        throw new Error("Erro interno ao processar saldo no banco de dados.");
      }

      const { error: updateError } = await supabaseClient
        .from('contracts')
        .update({ status: 'COMPLETED', updated_at: new Date().toISOString() })
        .eq('id', contractId);

      if (updateError) throw updateError;
      
      return new Response(JSON.stringify({ success: true, status: 'COMPLETED' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      });
    }

    // Outras ações (ACCEPT, REJECT)
    if (action === 'ACCEPT' || action === 'REJECT') {
      const newStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';
      const { error: updateError } = await supabaseClient
        .from('contracts')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', contractId);
      
      if (updateError) throw updateError;
      return new Response(JSON.stringify({ success: true, status: newStatus }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida." }), { status: 400, headers: corsHeaders });

  } catch (error: any) {
    console.error("[contract-state-machine] Global Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})