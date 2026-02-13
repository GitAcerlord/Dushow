"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ProDashboard from './pro/Dashboard';
import ClientDashboard from './client/Dashboard';
import ProducerDashboard from './producer/ProducerDashboard';
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

  if (loading) return (
    <div className="h-[calc(100vh-64px)] flex items-center justify-center">
      <Loader2 className="animate-spin w-10 h-10 text-indigo-600" />
    </div>
  );

  // Roteamento de Dashboard por Contexto
  switch (profile?.active_context) {
    case 'PRODUCER':
      return <ProducerDashboard />;
    case 'CONTRACTOR':
    case 'CLIENT':
      return <ClientDashboard />;
    case 'PRO':
    default:
      return <ProDashboard />;
  }
};

export default Dashboard;
