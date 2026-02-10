"use client";

import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Bell } from 'lucide-react';

const AppLayout = () => {
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate('/login');
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(data);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (!profile) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <AppSidebar profile={profile} onContextChange={fetchProfile} />
      <main className="flex-1 md:ml-64 transition-all duration-300">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Modo: <span className={profile.active_context === 'PRO' ? "text-indigo-600" : "text-blue-600"}>{profile.active_context}</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-indigo-600"><Bell className="w-5 h-5" /></button>
            <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden border">
              <img src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.full_name}`} alt="Avatar" />
            </div>
          </div>
        </header>
        <div className="p-4 md:p-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;