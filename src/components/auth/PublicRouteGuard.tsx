"use client";

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type PublicRouteGuardProps = {
  children: React.ReactNode;
};

const PublicRouteGuard = ({ children }: PublicRouteGuardProps) => {
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const { data, error } = await supabase
          .from("admin_platform_settings")
          .select("setting_value")
          .eq("setting_key", "global")
          .maybeSingle();

        if (!error) {
          const value = data?.setting_value as Record<string, unknown> | null;
          const enabled = Boolean(value?.maintenanceMode);
          setMaintenanceMode(enabled);
        }
      } finally {
        setLoading(false);
      }
    };

    checkMaintenanceMode();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (maintenanceMode) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-xl p-8 text-center space-y-4">
          <h1 className="text-2xl font-black text-slate-900">Plataforma em manutencao</h1>
          <p className="text-slate-600">
            O acesso publico esta temporariamente indisponivel. Tente novamente em alguns minutos.
          </p>
          <div className="pt-2">
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
              <Link to="/login">Entrar</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default PublicRouteGuard;
