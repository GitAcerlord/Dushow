"use client";

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, UserCircle, MessageSquare, Calendar,
  Trophy, CreditCard, Sparkles, LogOut, Mic2, Star, FileText, Menu, Rss, ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { showSuccess } from '@/utils/toast';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: 'Meu Painel', path: '/pro' },
  { icon: UserCircle, label: 'Meu Perfil', path: '/pro/profile' },
  { icon: Rss, label: 'Feed Social', path: '/pro/feed' },
  { icon: MessageSquare, label: 'Mensagens', path: '/pro/messages' },
  { icon: Star, label: 'Avaliações', path: '/pro/reviews' },
  { icon: FileText, label: 'Meus Contratos', path: '/pro/contracts' },
  { icon: Calendar, label: 'Minha Agenda', path: '/pro/agenda' },
  { icon: ShieldCheck, label: 'Meus Selos', path: '/pro/badges' },
  { icon: Trophy, label: 'Conquistas', path: '/pro/achievements' },
  { icon: Sparkles, label: 'Planos & Upgrade', path: '/pro/plans' },
  { icon: CreditCard, label: 'Financeiro', path: '/pro/finance' },
];

const SidebarContent = ({ onClose }: { onClose?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    showSuccess("Sessão encerrada.");
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 flex items-center gap-3 border-b">
        <div className="bg-indigo-600 p-1.5 rounded-lg">
          <Mic2 className="text-white w-5 h-5" />
        </div>
        <span className="text-xl font-bold text-slate-900 tracking-tight">DUSHOW <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded ml-1 uppercase">Pro</span></span>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              location.pathname === item.path 
                ? "bg-indigo-50 text-indigo-600 font-bold" 
                : "hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5",
              location.pathname === item.path ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
            )} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors text-slate-400"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </div>
  );
};

const ProSidebar = () => {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white h-screen border-r fixed left-0 top-0 z-50 flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <div className="md:hidden fixed top-4 left-4 z-[60]">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-white shadow-md">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default ProSidebar;