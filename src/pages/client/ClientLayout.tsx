"use client";

import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import ClientSidebar from '@/components/client/ClientSidebar';
import { Bell, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ClientLayout = () => {
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      
      if (data?.role !== 'CLIENT' && data?.role !== 'ADMIN') {
        navigate('/');
        return;
      }
      setProfile(data);
    };
    getProfile();
  }, [navigate]);

  if (!profile) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <ClientSidebar />
      <main className="flex-1 md:ml-64 transition-all duration-300">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
          <div className="text-sm font-medium text-slate-500">
            Bem-vindo, <span className="text-blue-600 font-bold">{profile.full_name}</span>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            <button className="relative text-slate-400 hover:text-blue-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">{profile.full_name}</p>
                <p className="text-xs text-slate-500">Conta Contratante</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden border-2 border-blue-50">
                <img src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.full_name}`} alt="Avatar" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
};

export default ClientLayout;