"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ProDashboard from './pro/Dashboard';
import ClientDashboard from './client/Dashboard';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return profile?.active_context === 'PRO' ? <ProDashboard /> : <ClientDashboard />;
};

export default Dashboard;