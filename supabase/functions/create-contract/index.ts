import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) throw new Error("Nao autorizado.");

    const {
      proId,
      eventId,
      eventName,
      eventDate,
      location,
      details,
      durationMinutes,
      notes,
    } = await req.json();

    if (!proId || !eventName || !eventDate || !location || !details) {
      throw new Error("Campos obrigatorios ausentes.");
    }
    if (proId === user.id) {
      throw new Error("contratante_profile_id deve ser diferente de profissional_profile_id.");
    }

    const { data: artist, error: artistError } = await supabase
      .from("profiles")
      .select("id, role, full_name, base_fee, avatar_url")
      .eq("id", proId)
      .single();
    if (artistError || !artist) throw new Error("Profissional nao localizado.");
    if (artist.role !== "PRO") throw new Error("Perfil informado nao e profissional.");
    if (!artist.avatar_url) throw new Error("Profissional sem foto obrigatoria para busca/contratacao.");

    const eventIso = new Date(eventDate).toISOString();
    const { data: blocks, error: blocksError } = await supabase
      .from("availability_blocks")
      .select("id")
      .eq("profile_id", proId)
      .lte("start_date", eventIso)
      .gte("end_date", eventIso)
      .limit(1);
    if (blocksError) throw blocksError;
    if ((blocks ?? []).length > 0) throw new Error("Data indisponivel na agenda do profissional.");

    const baseFee = Number(artist.base_fee ?? 0);
    const normalizedDuration = typeof durationMinutes === "number" && durationMinutes > 0 ? durationMinutes : null;

    let resolvedEventId = eventId ?? null;
    if (resolvedEventId) {
      const { data: existingEvent, error: existingEventError } = await supabase
        .from("client_events")
        .select("id, contratante_profile_id")
        .eq("id", resolvedEventId)
        .single();
      if (existingEventError || !existingEvent || existingEvent.contratante_profile_id !== user.id) {
        throw new Error("Evento informado invalido.");
      }
    } else {
      const { data: foundEvent } = await supabase
        .from("client_events")
        .select("id")
        .eq("contratante_profile_id", user.id)
        .eq("name", eventName)
        .eq("location", location)
        .gte("event_date", new Date(new Date(eventIso).setHours(0, 0, 0, 0)).toISOString())
        .lte("event_date", new Date(new Date(eventIso).setHours(23, 59, 59, 999)).toISOString())
        .limit(1);
      if (foundEvent && foundEvent.length > 0) {
        resolvedEventId = foundEvent[0].id;
      } else {
        const { data: createdEvent, error: createEventError } = await supabase
          .from("client_events")
          .insert({
            contratante_profile_id: user.id,
            name: eventName,
            event_date: eventIso,
            location,
            status: "EM_NEGOCIACAO",
          })
          .select("id")
          .single();
        if (createEventError || !createdEvent) throw new Error("Falha ao criar evento.");
        resolvedEventId = createdEvent.id;
      }
    }

    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .insert({
        client_event_id: resolvedEventId,
        contratante_profile_id: user.id,
        profissional_profile_id: proId,
        created_by_profile_id: user.id,
        client_id: user.id,
        pro_id: proId,
        event_name: eventName,
        data_evento: eventIso,
        event_date: eventIso,
        local: location,
        event_location: location,
        descricao: details,
        contract_text: details,
        valor_atual: baseFee,
        valor_original: baseFee,
        proposed_value: baseFee,
        value: baseFee,
        duration_minutes: normalizedDuration,
        notes: notes ?? null,
        status: "PROPOSTO",
        status_v1: "PROPOSTA_ENVIADA",
        status_master: "PROPOSTO",
      })
      .select()
      .single();
    if (contractError) throw contractError;

    await supabase.from("notifications").insert({
      user_id: proId,
      title: "Nova Proposta Recebida",
      content: `Voce recebeu uma proposta para o evento "${eventName}".`,
      type: "CONTRACT_PROPOSAL",
      link: `/app/contracts/${contract.id}`,
    });

    return new Response(JSON.stringify(contract), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
