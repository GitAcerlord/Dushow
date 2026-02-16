"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ProProfile from "./pro/Profile";
import ClientProfile from "./client/Profile";

const UnifiedProfile = () => {
  const [loading, setLoading] = useState(true);
  const [activeContext, setActiveContext] = useState("PRO");
  const [role, setRole] = useState("PRO");

  useEffect(() => {
    const fetchContext = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("active_context, role")
        .eq("id", user.id)
        .single();
      setActiveContext(data?.active_context || "PRO");
      setRole(data?.role || "PRO");
      setLoading(false);
    };

    fetchContext();
  }, []);

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="animate-spin text-[#2D1B69] w-10 h-10" />
      </div>
    );
  }

  if (activeContext === "PRO" || role === "PRO") return <ProProfile />;
  return <ClientProfile />;
};

export default UnifiedProfile;
