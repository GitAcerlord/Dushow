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

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) throw new Error("Não autorizado")

    const { proId, eventName, eventDate, location, details } = await req.json()

    // Validação de campos obrigatórios
    if (!proId || !eventName || !eventDate) {
      throw new Error("Campos obrigatórios ausentes: Artista, Nome do Evento ou Data.");
    }

    // Busca o preço real do artista para evitar manipulação no front
    const { data: artist, error: artistError } = await supabaseClient
      .from('profiles')
      .select('base_fee, full_name')
      .eq('id', proId)
      .single();

    if (artistError || !artist) throw new Error("Artista não localizado.");

    // Criação do contrato com status PENDING
    const { data: contract, error: contractError } = await supabaseClient
      .from('contracts')
      .insert({
        contratante_profile_id: user.id,
        profissional_profile_id: proId,
        event_name: eventName,
        data_evento: eventDate,
        event_location: location,
        valor_atual: artist.base_fee || 0,
        valor_original: artist.base_fee || 0,
        contract_text: details,
        status: 'PENDING',
        created_by_profile_id: user.id
      })
      .select()
      .single();

    if (contractError) throw contractError;

    // Notificação (Simulada via tabela de notificações)
    await supabaseClient.from('notifications').insert({
      user_id: proId,
      title: "Nova Proposta Recebida! 🎤",
      content: `Você recebeu uma proposta para o evento "${eventName}".`,
      type: 'CONTRACT_PROPOSAL',
      link: `/app/contracts/${contract.id}`
    });

    return new Response(JSON.stringify(contract), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("[create-contract] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: corsHeaders
    })
  }
})