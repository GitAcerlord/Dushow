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

    const body = await req.json();
    const { contractId, action, userId, reason, openedBy, resolution, resolvedBy } = body;
    
    const { data: contract, error: fetchError } = await supabaseClient
      .from('contracts')
      .select('*, pro:profiles!contracts_pro_id_fkey(*)')
      .eq('id', contractId)
      .single()

    if (fetchError || !contract) throw new Error("Contrato não localizado.");

    if (action === 'COMPLETE_EVENT') {
      if (contract.client_id !== userId) throw new Error("Apenas o contratante pode liberar o pagamento.");
      if (contract.status !== 'PAID') throw new Error("O contrato ainda não foi pago ou já foi concluído.");

      const feePercentage = 0.15;
      const artistNet = Number(contract.value) * (1 - feePercentage);

      const { error: rpcError } = await supabaseClient.rpc('release_artist_funds', {
        artist_id: contract.pro_id,
        amount: artistNet
      });

      if (rpcError) throw new Error("Erro interno ao processar saldo.");

      const { error: updateError } = await supabaseClient
        .from('contracts')
        .update({ status: 'COMPLETED' })
        .eq('id', contractId);

      if (updateError) throw updateError;
      // Conceder XP ao profissional pelo fechamento do contrato
      try {
        const proId = contract.pro_id;
        const currentXp = Number(contract.pro?.xp_total || 0);
        await supabaseClient.from('profiles').update({ xp_total: currentXp + 50 }).eq('id', proId);
      } catch (xpErr) {
        console.error('Erro ao conceder XP:', xpErr?.message || xpErr);
      }
      
      return new Response(JSON.stringify({ success: true, status: 'COMPLETED' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      });
    }

    if (action === 'ACCEPT' || action === 'REJECT') {
      const newStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';
      const { error: updateError } = await supabaseClient
        .from('contracts')
        .update({ status: newStatus })
        .eq('id', contractId);
      
      if (updateError) throw updateError;
      return new Response(JSON.stringify({ success: true, status: newStatus }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      });
    }

    // Abrir disputa (cliente ou pro) - adiciona metadados de disputa no contrato
    if (action === 'OPEN_DISPUTE') {
      const disputeData: any = {
        status: 'DISPUTED',
        dispute_opened_at: new Date().toISOString(),
        dispute_opened_by: openedBy || userId,
        dispute_reason: reason || null
      };

      const { error: disputeErr } = await supabaseClient
        .from('contracts')
        .update(disputeData)
        .eq('id', contractId);

      if (disputeErr) throw disputeErr;
      return new Response(JSON.stringify({ success: true, status: 'DISPUTED' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // Resolver disputa (admin action) - 'resolution' = 'PRO' | 'CLIENT'
    if (action === 'RESOLVE_DISPUTE') {
      // SECURITY: ensure caller is an ADMIN
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) throw new Error('Unauthorized');
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
      if (authError || !user) throw new Error('Unauthorized');

      const { data: profile, error: profileErr } = await supabaseClient
        .from('profiles')
        .select('type, role, is_admin')
        .eq('user_id', user.id)
        .single();
      if (profileErr) throw new Error('Não foi possível verificar permissões.');

      const isAdmin = (profile?.type === 'Admin') || (profile?.role === 'ADMIN') || (profile?.role === 'admin') || (profile?.is_admin === true);
      if (!isAdmin) throw new Error('Ação restrita a administradores.');

      if (!['PRO', 'CLIENT'].includes(resolution)) throw new Error('Resolution inválida.');

      if (resolution === 'PRO') {
        // Liberar fundos para o artista
        const feePercentage = 0.15;
        const artistNet = Number(contract.value) * (1 - feePercentage);
        const { error: rpcError } = await supabaseClient.rpc('release_artist_funds', {
          artist_id: contract.pro_id,
          amount: artistNet
        });
        if (rpcError) throw rpcError;

        await supabaseClient.from('contracts').update({ status: 'COMPLETED', dispute_resolved_by: resolvedBy || user.id, dispute_resolution: 'PRO', dispute_resolved_at: new Date().toISOString() }).eq('id', contractId);
        return new Response(JSON.stringify({ success: true, status: 'COMPLETED' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      } else {
        // Resolução a favor do cliente: marcar como REFUNDED e criar entradas de reversão no ledger
        const { error: refundLedgerErr } = await supabaseClient.from('financial_ledger').insert([
          { contract_id: contractId, user_id: contract.client_id, amount: Number(contract.value), type: 'CREDIT', description: `Reembolso por disputa: ${contract.event_name}` },
          { contract_id: contractId, user_id: contract.pro_id, amount: -Number(contract.value), type: 'DEBIT', description: `Reversão por disputa: ${contract.event_name}` }
        ]);
        if (refundLedgerErr) console.error('Erro ao inserir ledger de reversão:', refundLedgerErr.message);

        await supabaseClient.from('contracts').update({ status: 'REFUNDED', dispute_resolved_by: resolvedBy || user.id, dispute_resolution: 'CLIENT', dispute_resolved_at: new Date().toISOString() }).eq('id', contractId);
        return new Response(JSON.stringify({ success: true, status: 'REFUNDED' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
    }

    return new Response(JSON.stringify({ error: "Ação inválida." }), { status: 400, headers: corsHeaders });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})