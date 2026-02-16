import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const toTwoDigits = (value: string) => value.padStart(2, "0");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Nao autorizado.");

    const { number, name, expiry, cvv, cpfCnpj, postalCode, addressNumber, phone } = await req.json();

    const cleanNumber = String(number || "").replace(/\D/g, "");
    const cleanCvv = String(cvv || "").replace(/\D/g, "");
    const cleanCpf = String(cpfCnpj || "").replace(/\D/g, "");
    const cleanPhone = String(phone || "").replace(/\D/g, "");
    const cleanPostalCode = String(postalCode || "").replace(/\D/g, "");
    const holderName = String(name || "").trim();
    const [rawMonth, rawYear] = String(expiry || "").split("/");
    const expMonth = toTwoDigits(String(rawMonth || "").replace(/\D/g, ""));
    const expYear = String(rawYear || "").replace(/\D/g, "").length === 2
      ? `20${String(rawYear).replace(/\D/g, "")}`
      : String(rawYear || "").replace(/\D/g, "");

    if (!cleanNumber || cleanNumber.length < 13) throw new Error("Numero de cartao invalido.");
    if (!holderName) throw new Error("Nome no cartao obrigatorio.");
    if (!expMonth || !expYear) throw new Error("Validade do cartao obrigatoria.");
    if (!cleanCvv || cleanCvv.length < 3) throw new Error("CVV invalido.");
    if (!cleanCpf || cleanCpf.length < 11) throw new Error("CPF/CNPJ obrigatorio.");
    if (!cleanPostalCode || cleanPostalCode.length < 8) throw new Error("CEP obrigatorio.");
    if (!addressNumber) throw new Error("Numero do endereco obrigatorio.");
    if (!cleanPhone || cleanPhone.length < 10) throw new Error("Telefone obrigatorio.");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, asaas_customer_id")
      .eq("id", user.id)
      .single();
    if (profileError || !profile) throw new Error("Perfil nao localizado.");
    if (!profile.asaas_customer_id) throw new Error("Conta Asaas nao configurada para este usuario.");

    const asaasApiKey = Deno.env.get("ASAAS_API_KEY") ?? "";
    const asaasBaseUrl = Deno.env.get("ASAAS_URL") ?? "https://api.asaas.com/v3";
    if (!asaasApiKey) throw new Error("ASAAS_API_KEY nao configurada.");

    const body = {
      customer: profile.asaas_customer_id,
      creditCard: {
        holderName,
        number: cleanNumber,
        expiryMonth: expMonth,
        expiryYear: expYear,
        ccv: cleanCvv,
      },
      creditCardHolderInfo: {
        name: holderName,
        email: profile.email || "nao-informado@dushow.app",
        cpfCnpj: cleanCpf,
        postalCode: cleanPostalCode,
        addressNumber: String(addressNumber),
        phone: cleanPhone,
      },
    };

    const requestHeaders = {
      "Content-Type": "application/json",
      access_token: asaasApiKey,
    };

    let tokenResponse = await fetch(`${asaasBaseUrl}/creditCard/tokenizeCreditCard`, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(body),
    });

    if (tokenResponse.status === 404) {
      tokenResponse = await fetch(`${asaasBaseUrl}/creditCard/tokenize`, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(body),
      });
    }

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error(tokenData?.errors?.[0]?.description || tokenData?.message || "Falha ao tokenizar cartao no Asaas.");
    }

    const gatewayToken = tokenData?.creditCardToken || tokenData?.token || null;
    if (!gatewayToken) throw new Error("Asaas nao retornou token do cartao.");

    const brand = String(tokenData?.creditCardBrand || tokenData?.brand || "CARD");
    const last4 = cleanNumber.slice(-4);
    const monthNumber = Number(expMonth);
    const yearNumber = Number(expYear);

    const { data: existingCards } = await supabase
      .from("payment_methods")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    const storedToken = `asaas:${gatewayToken}`;
    const { data: insertedCard, error: insertError } = await supabase
      .from("payment_methods")
      .insert({
        user_id: user.id,
        brand,
        last4,
        exp_month: monthNumber,
        exp_year: yearNumber,
        gateway_token: storedToken,
        is_default: (existingCards || []).length === 0,
      })
      .select()
      .single();
    if (insertError || !insertedCard) throw insertError || new Error("Falha ao salvar cartao.");

    return new Response(JSON.stringify({ success: true, card: insertedCard }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
