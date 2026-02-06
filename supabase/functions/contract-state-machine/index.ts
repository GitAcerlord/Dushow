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
    console.log(`[contract-state-machine] Action: ${action} | Contract: ${contractId} | User: ${userId}`);

    // 1. Buscar estado atual do contrato
    const { data: contract, error: fetchError } = await supabaseClient
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single()

    if (fetchError || !contract) throw new Error("Contrato não localizado.");

    let nextStatus = contract.status;
    const currentStatus = contract.status;

    // 2. MÁQUINA DE ESTADOS - Validação de Transições
    switch (action) {
      case 'ACCEPT':
        // Aceita se estiver CREATED ou PENDING (após negociação)
        if (currentStatus !== 'CREATED' && currentStatus !== 'PENDING') {
          throw new Error(`Transição inválida: Status atual é ${currentStatus}`);
        }
        // Verifica se quem está aceitando é o profissional do contrato
        if (userId !== contract.pro_id) {
          throw new Error("Não autorizado: Apenas o profissional pode aceitar.");
        }
        nextStatus = 'ACCEPTED';
        break;

      case 'REJECT':
        if (currentStatus !== 'CREATED' && currentStatus !== 'PENDING') {
          throw new Error("Transição inválida para rejeição.");
        }
        nextStatus = 'REJECTED';
        break;

      case 'SIGN':
        if (currentStatus !== 'ACCEPTED') throw new Error("Contrato precisa ser aceito antes de assinar.");
        nextStatus = 'PENDING_SIGNATURE';
        break;

      case 'COMPLETE':
        if (currentStatus !== 'PAID' && currentStatus !== 'PENDING_SIGNATURE') {
          throw new Error("Apenas contratos pagos ou assinados podem ser concluídos.");
        }
        nextStatus = 'COMPLETED';
        
        // 💰 LÓGICA FINANCEIRA (LEDGER)
        const gross = Number(contract.value);
        const feeRate = 0.15; 
        const platformFee = gross * feeRate;
        const artistNet = gross - platformFee;

        // Inserir no Ledger (Auditável)
        const { error: ledgerError } = await supabaseClient.from('financial_ledger').insert([
          { contract_id: contractId, user_id: contract.client_id, amount: -gross, type: 'GROSS_PAYMENT', description: `Pagamento Evento: ${contract.event_name}` },
          { contract_id: contractId, user_id: contract.pro_id, amount: artistNet, type: 'ARTIST_NET', description: `Recebimento Líquido: ${contract.event_name}` },
          { contract_id: contractId, user_id: contract.pro_id, amount: platformFee, type: 'PLATFORM_FEE', description: `Comissão DUSHOW: ${contract.event_name}` }
        ]);

        if (ledgerError) console.error("[contract-state-machine] Ledger Error:", ledgerError);

        // Atualizar XP do Artista
        const { data: proProfile } = await supabaseClient.from('profiles').select('xp_total').eq('id', contract.pro_id).single();
        await supabaseClient.from('profiles').update({ xp_total: (proProfile?.xp_total || 0) + 100 }).eq('id', contract.pro_id);
        break;

      default:
        throw new Error("Ação desconhecida.");
    }

    // 3. Persistência Real no Banco
    const { error: updateError } = await supabaseClient
      .from('contracts')
      .update({ status: nextStatus })
      .eq('id', contractId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, status: nextStatus }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("[contract-state-machine] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: corsHeaders
    })
  }
})