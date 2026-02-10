"use client";

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, UserCircle, MessageSquare, Calendar,
  Trophy, CreditCard, Sparkles, LogOut, Mic2, Star, FileText, 
  Menu, Rss, ShieldCheck, Search, Heart, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from '@/utils/toast';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const AppSidebar = ({ profile, onContextChange }: any) => {
  const location = useLocation();
  const navigate = useNavigate();
  const context = profile?.active_context || 'PRO';

  const menuItems = context === 'PRO' ? [
    { icon: LayoutDashboard, label: 'Painel Pro', path: '/app' },
    { icon: Rss, label: 'Feed Artístico', path: '/app/feed' },
    { icon: MessageSquare, label: 'Mensagens', path: '/app/messages' },
    { icon: FileText, label: 'Meus Contratos', path: '/app/contracts' },
    { icon: Calendar, label: 'Minha Agenda', path: '/app/agenda' },
    { icon: CreditCard, label: 'Financeiro', path: '/app/finance' },
  ] : [
    { icon: LayoutDashboard, label: 'Painel Cliente', path: '/app' },
    { icon: Search, label: 'Buscar Artistas', path: '/app/discovery' },
    { icon: Rss, label: 'Feed Social', path: '/app/feed' },
    { icon: Calendar, label: 'Meus Eventos', path: '/app/events' },
    { icon: MessageSquare, label: 'Mensagens', path: '/app/messages' },
    { icon: Heart, label: 'Favoritos', path: '/app/favorites' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const toggleContext = async () => {
    const newContext = context === 'PRO' ? 'CLIENT' : 'PRO';
    const { error } = await supabase.from('profiles').update({ active_context: newContext }).eq('id', profile.id);
    if (!error) {
      showSuccess(`Contexto alterado para ${newContext}`);
      onContextChange(newContext);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-lg text-white", context === 'PRO' ? "bg-indigo-600" : "bg-blue-600")}>
            <Mic2 className="w-5 h-5" />
          </div>
          <span className="text-xl font-black tracking-tight">DUSHOW</span>
        </div>
      </div>

      <div className="p-4">
        <Button 
          onClick={toggleContext}
          variant="outline" 
          className={cn(
            "w-full justify-start gap-3 rounded-xl border-2 font-bold transition-all",
            context === 'PRO' ? "border-indigo-100 text-indigo-600 hover:bg-indigo-50" : "border-blue-100 text-blue-600 hover:bg-blue-50"
          )}
        >
          <RefreshCw className="w-4 h-4" />
          Mudar para {context === 'PRO' ? 'Contratante' : 'Profissional'}
        </Button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              location.pathname === item.path 
                ? (context === 'PRO' ? "bg-indigo-50 text-indigo-600 font-bold" : "bg-blue-50 text-blue-600 font-bold")
                : "hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t space-y-2">
        <Link to="/app/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-500">
          <UserCircle className="w-5 h-5" />
          <span className="font-medium">Meu Perfil Único</span>
        </Link>
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-red-50 text-red-500 transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex w-64 bg-white h-screen border-r fixed left-0 top-0 z-50 flex-col">
        <SidebarContent />
      </aside>
      <div className="md:hidden fixed top-4 left-4 z-[60]">
        <Sheet>
          <SheetTrigger asChild><Button variant="outline" size="icon" className="bg-white shadow-md"><Menu className="w-5 h-5" /></Button></SheetTrigger>
          <SheetContent side="left" className="p-0 w-72"><SidebarContent /></SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default AppSidebar;