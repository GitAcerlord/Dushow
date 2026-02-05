"use client";

import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import ProSidebar from '@/components/pro/ProSidebar';
import { Bell, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ProLayout = () => {
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
      setProfile(data);
    };
    getProfile();
  }, [navigate]);

  if (!profile) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <ProSidebar />
      {/* ml-0 no mobile, ml-64 no desktop */}
      <main className="flex-1 md:ml-64 transition-all duration-300">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
          <div className="relative w-full max-w-[200px] md:max-w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            <button className="relative text-slate-400 hover:text-indigo-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">{profile.full_name}</p>
                <p className="text-xs text-emerald-600 font-medium">{profile.is_superstar ? 'Plano Superstar' : 'Plano Pro'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold overflow-hidden border-2 border-indigo-100">
                <img src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.full_name}`} alt="Avatar" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>
        <div className="pb-20 md:pb-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ProLayout;