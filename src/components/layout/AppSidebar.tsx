"use client";

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, UserCircle, MessageSquare, Calendar,
  Trophy, CreditCard, Sparkles, LogOut, Mic2, Star, FileText, 
  Menu, Rss, ShieldCheck, Search, Heart, RefreshCw, Ticket,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const AppSidebar = ({ profile, onContextChange }: any) => {
  const location = useLocation();
  const navigate = useNavigate();
  const context = profile?.active_context || 'PRO';

  // Definição de Menus por Contexto
  const menuConfigs: any = {
    PRO: {
      label: 'Profissional',
      color: 'indigo',
      items: [
        { icon: LayoutDashboard, label: 'Painel Pro', path: '/app' },
        { icon: Rss, label: 'Feed Artístico', path: '/app/feed' },
        { icon: MessageSquare, label: 'Mensagens', path: '/app/messages' },
        { icon: FileText, label: 'Meus Contratos', path: '/app/contracts' },
        { icon: Calendar, label: 'Minha Agenda', path: '/app/agenda' },
        { icon: CreditCard, label: 'Financeiro', path: '/app/finance' },
      ]
    },
    PRODUCER: {
      label: 'Produtor',
      color: 'purple',
      items: [
        { icon: LayoutDashboard, label: 'Painel Produtor', path: '/app' },
        { icon: Ticket, label: 'Minha Bilheteria', path: '/app/producer' },
        { icon: FileText, label: 'Gestão de Contratos', path: '/app/contracts' },
        { icon: Search, label: 'Contratar Artistas', path: '/app/discovery' },
        { icon: MessageSquare, label: 'Mensagens', path: '/app/messages' },
        { icon: CreditCard, label: 'Financeiro', path: '/app/finance' },
      ]
    },
    CLIENT: {
      label: 'Contratante',
      color: 'blue',
      items: [
        { icon: LayoutDashboard, label: 'Painel Cliente', path: '/app' },
        { icon: Search, label: 'Buscar Artistas', path: '/app/discovery' },
        { icon: Rss, label: 'Feed Social', path: '/app/feed' },
        { icon: Calendar, label: 'Meus Eventos', path: '/app/events' },
        { icon: MessageSquare, label: 'Mensagens', path: '/app/messages' },
        { icon: Heart, label: 'Favoritos', path: '/app/favorites' },
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
    
    const { error } = await supabase
      .from('profiles')
      .update({ active_context: newContext })
      .eq('id', profile.id);

    if (!error) {
      showSuccess(`Modo ${menuConfigs[newContext].label} ativado.`);
      onContextChange(); // Recarrega o perfil no AppLayout
      navigate('/app'); // Volta para o dashboard do novo contexto
    } else {
      showError("Erro ao trocar de contexto.");
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-1.5 rounded-lg text-white shadow-lg",
            context === 'PRO' ? "bg-indigo-600" : context === 'PRODUCER' ? "bg-purple-600" : "bg-blue-600"
          )}>
            <Mic2 className="w-5 h-5" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900">DUSHOW</span>
        </div>
      </div>

      {/* Seletor de Contexto (Switcher) */}
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "w-full justify-between gap-3 rounded-xl border-2 font-bold transition-all h-12",
                context === 'PRO' ? "border-indigo-100 text-indigo-600 hover:bg-indigo-50" : 
                context === 'PRODUCER' ? "border-purple-100 text-purple-600 hover:bg-purple-50" :
                "border-blue-100 text-blue-600 hover:bg-blue-50"
              )}
            >
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                <span>Modo: {currentConfig.label}</span>
              </div>
              <Menu className="w-4 h-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 rounded-xl shadow-2xl border-slate-100" align="start">
            <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400">Alterar Contexto</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => switchContext('PRO')} className="gap-3 py-3 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><Mic2 size={16} /></div>
              <div className="flex flex-col">
                <span className="font-bold text-sm">Profissional</span>
                <span className="text-[10px] text-slate-400">Venda seus serviços</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => switchContext('PRODUCER')} className="gap-3 py-3 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><Ticket size={16} /></div>
              <div className="flex flex-col">
                <span className="font-bold text-sm">Produtor</span>
                <span className="text-[10px] text-slate-400">Gestão de Bilheteria</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => switchContext('CLIENT')} className="gap-3 py-3 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Search size={16} /></div>
              <div className="flex flex-col">
                <span className="font-bold text-sm">Contratante</span>
                <span className="text-[10px] text-slate-400">Busque e contrate</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {currentConfig.items.map((item: any) => (
          <Link
            key={item.label}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              location.pathname === item.path 
                ? (context === 'PRO' ? "bg-indigo-50 text-indigo-600 font-bold" : 
                   context === 'PRODUCER' ? "bg-purple-50 text-purple-600 font-bold" :
                   "bg-blue-50 text-blue-600 font-bold")
                : "hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t space-y-2">
        <Link to="/app/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors">
          <UserCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Meu Perfil Único</span>
        </Link>
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-red-50 text-red-500 transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Sair</span>
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