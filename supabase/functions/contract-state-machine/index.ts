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

    const body = await req.json()
    const { contractId, action, userId } = body
    
    console.log(`[contract-state-machine] Processando: ${action} para Contrato: ${contractId} (User: ${userId})`);

    if (!contractId || !action || !userId) {
      throw new Error("Parâmetros ausentes: contractId, action e userId são obrigatórios.");
    }

    // 1. Buscar estado atual do contrato
    const { data: contract, error: fetchError } = await supabaseClient
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single()

    if (fetchError || !contract) {
      console.error("[contract-state-machine] Contrato não encontrado:", contractId);
      throw new Error("Contrato não localizado no banco de dados.");
    }

    let nextStatus = contract.status;
    const currentStatus = contract.status;

    // 2. MÁQUINA DE ESTADOS - Validação de Transições
    switch (action) {
      case 'ACCEPT':
        // Aceita se estiver CREATED ou PENDING
        if (currentStatus !== 'CREATED' && currentStatus !== 'PENDING') {
          throw new Error(`Transição inválida: O contrato está como ${currentStatus} e não pode ser aceito.`);
        }
        // Validação de Identidade: Apenas o profissional (pro_id) pode aceitar
        if (userId !== contract.pro_id) {
          throw new Error("Ação negada: Apenas o profissional designado pode aceitar este contrato.");
        }
        nextStatus = 'ACCEPTED';
        break;

      case 'REJECT':
        if (currentStatus !== 'CREATED' && currentStatus !== 'PENDING') {
          throw new Error(`Transição inválida: O contrato está como ${currentStatus} e não pode ser rejeitado.`);
        }
        nextStatus = 'REJECTED';
        break;

      case 'COMPLETE':
        // Apenas contratos pagos (PAID) podem ser concluídos
        if (currentStatus !== 'PAID') {
          throw new Error("Transição inválida: O contrato precisa estar PAGO para ser concluído.");
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

        if (ledgerError) console.error("[contract-state-machine] Erro ao gerar Ledger:", ledgerError);

        // Atualizar XP do Artista
        const { data: proProfile } = await supabaseClient.from('profiles').select('xp_total').eq('id', contract.pro_id).single();
        await supabaseClient.from('profiles').update({ xp_total: (proProfile?.xp_total || 0) + 100 }).eq('id', contract.pro_id);
        break;

      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }

    // 3. Persistência Real no Banco
    const { error: updateError } = await supabaseClient
      .from('contracts')
      .update({ status: nextStatus })
      .eq('id', contractId);

    if (updateError) throw updateError;

    console.log(`[contract-state-machine] Sucesso: ${currentStatus} -> ${nextStatus}`);

    return new Response(JSON.stringify({ success: true, status: nextStatus }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("[contract-state-machine] Falha Crítica:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: corsHeaders
    })
  }
})