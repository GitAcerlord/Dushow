"use client";

import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Bell, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const AppLayout = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate('/login');
    
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(data);
    if (data?.pref_dark_mode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin w-10 h-10 text-[#2D1B69]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 fixed left-0 top-0 h-screen z-50 shadow-2xl">
        <AppSidebar profile={profile} />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 transition-all duration-300 min-h-screen flex flex-col">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-6 md:px-10 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Trigger */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-[#2D1B69]">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 bg-[#2D1B69] border-none">
                  <AppSidebar profile={profile} />
                </SheetContent>
              </Sheet>
            </div>
            <h2 className="text-lg font-black text-[#2D1B69] hidden sm:block uppercase tracking-tight">
              {profile.active_context === 'PRO' ? 'Painel Profissional' : profile.active_context === 'PRODUCER' ? 'Painel Produtor' : 'Painel Contratante'}
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="relative text-slate-400 hover:text-[#2D1B69] transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#FFB703] rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-[#2D1B69]">{profile.full_name}</p>
                <p className="text-[10px] text-[#FFB703] font-black uppercase tracking-widest">{profile.plan_tier}</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white shadow-sm">
                <img 
                  src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.full_name}`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 md:p-10 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
