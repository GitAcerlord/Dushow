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

    const { contractId, userId, role } = await req.json()
    
    // 1. AUDITORIA: Busca dados imutáveis para o Hash
    const { data: contract, error: fetchError } = await supabaseClient
      .from('contracts')
      .select('id, event_name, value, event_date, client_id, pro_id')
      .eq('id', contractId)
      .single()

    if (fetchError || !contract) throw new Error("Contrato não localizado para auditoria.")

    // 2. Coleta de Evidências Forenses
    const metadata = {
      ip: req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
      auth_id: userId
    }

    // 3. Geração de Hash de Integridade (SHA-256)
    const rawContent = `${contract.id}|${contract.event_name}|${contract.value}|${contract.event_date}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(rawContent);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    // 4. Persistência Real
    const updateData: any = { signature_hash: hashHex };
    if (role === 'CLIENT') {
      updateData.signed_by_client = true;
      updateData.signed_at_client = metadata.timestamp;
    } else {
      updateData.signed_by_pro = true;
      updateData.signed_at_pro = metadata.timestamp;
    }

    const { error: updateError } = await supabaseClient
      .from('contracts')
      .update(updateData)
      .eq('id', contractId)

    if (updateError) throw updateError

    console.log(`[digital-signature] Audit Success: Contract ${contractId} signed by ${role}`);

    return new Response(JSON.stringify({ success: true, hash: hashHex }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("[digital-signature] Audit Failure:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: corsHeaders
    })
  }
})