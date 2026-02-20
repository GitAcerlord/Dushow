import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";

type AdminProfile = {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role?: string | null;
};

export const useAdminSession = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AdminProfile | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      setLoading(true);

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        showError("Erro ao validar sessão.");
        navigate("/login", { replace: true, state: { from: location } });
        return;
      }

      if (!sessionData.session?.user) {
        navigate("/login", { replace: true, state: { from: location } });
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role")
        .eq("id", sessionData.session.user.id)
        .single();

      if (error || !data) {
        showError("Perfil não encontrado.");
        navigate("/login", { replace: true, state: { from: location } });
        return;
      }

      if (data.role !== "ADMIN") {
        showError("Acesso restrito ao painel administrativo.");
        navigate("/app", { replace: true });
        return;
      }

      setProfile(data);
      setLoading(false);
    };

    checkAdmin();
  }, [location, navigate]);

  return { loading, profile };
};
