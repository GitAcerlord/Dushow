"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProMessages from "./pro/Messages";
import ClientMessages from "./client/Messages";
import { Loader2 } from "lucide-react";

const Messages = () => {
  const [context, setContext] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("active_context")
        .eq("id", user.id)
        .single();
      setContext(profile?.active_context ?? "PRO");
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#2D1B69]" />
      </div>
    );
  }

  return context === "CLIENT" || context === "CONTRACTOR" ? <ClientMessages /> : <ProMessages />;
};

export default Messages;
