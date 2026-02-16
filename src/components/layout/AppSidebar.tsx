"use client";

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, UserCircle, MessageSquare, Calendar,
  CreditCard, LogOut, Mic2, FileText, 
  Menu, Rss, Search, Heart, RefreshCw, Ticket,
  Settings, HelpCircle, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const AppSidebar = ({ profile }: any) => {
  const location = useLocation();
  const navigate = useNavigate();
  const context = profile?.active_context || 'PRO';

  const menuConfigs: any = {
    PRO: {
      label: 'Profissional',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/app' },
        { icon: Rss, label: 'Feed', path: '/app/feed' },
        { icon: MessageSquare, label: 'Mensagens', path: '/app/messages' },
        { icon: FileText, label: 'Contratos', path: '/app/contracts' },
        { icon: Calendar, label: 'Agenda', path: '/app/agenda' },
        { icon: CreditCard, label: 'Financeiro', path: '/app/finance' },
        { icon: Lock, label: 'Plano', path: '/app/plans' },
      ]
    },
    PRODUCER: {
      label: 'Produtor',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/app' },
        { icon: Ticket, label: 'Bilheteria', path: '/app/producer' },
        { icon: FileText, label: 'Contratos', path: '/app/contracts' },
        { icon: Search, label: 'Artistas', path: '/app/discovery' },
        { icon: MessageSquare, label: 'Mensagens', path: '/app/messages' },
      ]
    },
    CONTRACTOR: {
      label: 'Contratante',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/app' },
        { icon: Search, label: 'Descobrir', path: '/app/discovery' },
        { icon: Calendar, label: 'Eventos', path: '/app/events' },
        { icon: MessageSquare, label: 'Mensagens', path: '/app/messages' },
        { icon: Heart, label: 'Favoritos', path: '/app/favorites' },
        { icon: CreditCard, label: 'Pagamentos', path: '/app/payments' },
        { icon: Lock, label: 'Plano', path: '/app/plans' },
      ]
    },
    CLIENT: {
      label: 'Contratante',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/app' },
        { icon: Search, label: 'Descobrir', path: '/app/discovery' },
        { icon: Calendar, label: 'Eventos', path: '/app/events' },
        { icon: MessageSquare, label: 'Mensagens', path: '/app/messages' },
        { icon: Heart, label: 'Favoritos', path: '/app/favorites' },
        { icon: CreditCard, label: 'Pagamentos', path: '/app/payments' },
        { icon: Lock, label: 'Plano', path: '/app/plans' },
      ]
    }
  };

  const currentConfig = menuConfigs[context] || menuConfigs.PRO;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const switchContext = async (newContext: string) => {
    if (newContext === context) return;
    const enabled = profile?.enabled_contexts || [];
    if (!enabled.includes(newContext)) {
      showError("Contexto não habilitado para este perfil.");
      return;
    }
    const { error } = await supabase.from('profiles').update({ active_context: newContext }).eq('id', profile.id);
    if (!error) window.location.href = '/app';
    else showError("Erro ao trocar de contexto.");
  };

  return (
    <div className="flex flex-col h-full bg-[#2D1B69] text-white w-full">
      {/* Brand Header */}
      <div className="p-8 flex items-center gap-4">
        <div className="bg-white/10 p-2 rounded-xl">
          <Mic2 className="text-[#FFB703] w-6 h-6" />
        </div>
        <span className="text-xl font-black tracking-tighter">DUSHOW</span>
      </div>

      {/* Context Switcher */}
      <div className="px-6 mb-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-between bg-white/5 hover:bg-white/10 text-white border-none rounded-xl h-12 px-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#FFB703]" />
                <span className="text-xs font-bold">{currentConfig.label}</span>
              </div>
              <Menu className="w-4 h-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-[#2D1B69] border-white/10 text-white" align="start">
            <DropdownMenuLabel className="text-[10px] uppercase opacity-50">Mudar Perfil</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem onClick={() => switchContext('PRO')} className="hover:bg-white/10 cursor-pointer gap-2">
              <Mic2 size={14} className="text-[#FFB703]" /> Profissional
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => switchContext('PRODUCER')} className="hover:bg-white/10 cursor-pointer gap-2">
              <Ticket size={14} className="text-[#FFB703]" /> Produtor
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => switchContext('CONTRACTOR')} className="hover:bg-white/10 cursor-pointer gap-2">
              <Search size={14} className="text-[#FFB703]" /> Contratante
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {currentConfig.items.map((item: any) => (
          <Link
            key={item.label}
            to={item.path}
            className={cn(
              "flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 group",
              location.pathname === item.path 
                ? "bg-white/10 text-[#FFB703]" 
                : "hover:bg-white/5 text-white/70 hover:text-white"
            )}
          >
            <item.icon className={cn("w-5 h-5", location.pathname === item.path ? "text-[#FFB703]" : "text-white/50 group-hover:text-white")} />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 mt-auto space-y-1 border-t border-white/10">
        <Link to="/app/profile" className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-colors">
          <UserCircle className="w-5 h-5 text-white/50" />
          <span className="text-sm font-medium">Meu Perfil</span>
        </Link>
        <Link to="/app/settings" className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-colors">
          <Settings className="w-5 h-5 text-white/50" />
          <span className="text-sm font-medium">Configurações</span>
        </Link>
        <button onClick={handleLogout} className="flex items-center gap-4 px-4 py-4 w-full rounded-xl hover:bg-red-500/10 text-red-400 transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Sair</span>
        </button>
      </div>
    </div>
  );
};

export default AppSidebar;
