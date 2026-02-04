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
    
    // 1. Buscar dados do contrato para gerar o Hash de Integridade
    const { data: contract, error: fetchError } = await supabaseClient
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single()

    if (fetchError || !contract) throw new Error("Contrato não encontrado")

    // 2. Capturar metadados do assinante (Real)
    const metadata = {
      ip: req.headers.get('x-real-ip') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
      userId: userId
    }

    // 3. Gerar Hash do Documento (SHA-256 simplificado para o exemplo)
    const contentToHash = `${contract.event_name}-${contract.value}-${contract.event_date}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(contentToHash);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 4. Atualizar Contrato
    const updateData: any = {
      document_hash: hashHex
    }

    if (role === 'CLIENT') {
      updateData.signed_by_client = true;
      updateData.signed_at_client = metadata.timestamp;
      updateData.client_signature_metadata = metadata;
    } else {
      updateData.signed_by_pro = true;
      updateData.signed_at_pro = metadata.timestamp;
      updateData.pro_signature_metadata = metadata;
    }

    const { error: updateError } = await supabaseClient
      .from('contracts')
      .update(updateData)
      .eq('id', contractId)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ success: true, hash: hashHex }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})