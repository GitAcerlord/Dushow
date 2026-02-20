import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_FIELDS = new Set(["is_verified", "is_superstar", "is_active", "plan_tier", "role"]);
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError || !user) throw new Error("Unauthorized");

    const { data: callerProfile } = await supabaseClient.from("profiles").select("role").eq("id", user.id).single();
    if (callerProfile?.role !== "ADMIN") throw new Error("Forbidden: Admin access required.");

    const payload = await req.json();
    const targetUserId = payload?.targetUserId;
    const rawUpdates = payload?.updates;

    if (!targetUserId || typeof targetUserId !== "string" || !UUID_REGEX.test(targetUserId)) {
      throw new Error("Invalid target user id.");
    }
    if (!rawUpdates || typeof rawUpdates !== "object" || Array.isArray(rawUpdates)) {
      throw new Error("Invalid updates payload.");
    }

    const updates = Object.fromEntries(
      Object.entries(rawUpdates).filter(([key, value]) => ALLOWED_FIELDS.has(key) && value !== undefined),
    );

    if (Object.keys(updates).length === 0) {
      throw new Error("No valid fields to update.");
    }

    const { data, error } = await supabaseClient.from("profiles").update(updates).eq("id", targetUserId).select().single();
    if (error) throw error;

    return new Response(JSON.stringify(data), {
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
