"use client";

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      // Verifica se o perfil existe (Perfil Único)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, active_context, enabled_contexts')
        .eq('id', session.user.id)
        .single();

      if (!profile) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      const enabled = profile.enabled_contexts || ['PRO'];
      const active = profile.active_context || enabled[0] || 'PRO';
      if (!enabled.includes(active)) {
        await supabase.from('profiles').update({ active_context: enabled[0] || 'PRO' }).eq('id', profile.id);
      }

      setAuthenticated(true);
      setLoading(false);
    };

    checkAuth();
  }, [location]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
