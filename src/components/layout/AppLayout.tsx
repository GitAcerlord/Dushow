"use client";

import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const AppLayout = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate('/login');
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    setProfile(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin w-10 h-10 text-indigo-600" />
    </div>
  );

  const context = profile?.active_context || 'PRO';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <AppSidebar profile={profile} onContextChange={fetchProfile} />
      <main className="flex-1 md:ml-64 transition-all duration-300">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              context === 'PRO' ? "bg-indigo-600" : context === 'PRODUCER' ? "bg-purple-600" : "bg-blue-600"
            )} />
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Modo Ativo: <span className={cn(
                "font-black",
                context === 'PRO' ? "text-indigo-600" : context === 'PRODUCER' ? "text-purple-600" : "text-blue-600"
              )}>
                {context === 'PRO' ? 'Profissional' : context === 'PRODUCER' ? 'Produtor' : 'Contratante'}
              </span>
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative text-slate-400 hover:text-indigo-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-900">{profile.full_name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{profile.plan_tier}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-100 overflow-hidden border-2 border-white shadow-sm">
                <img 
                  src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.full_name}`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
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