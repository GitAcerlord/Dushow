"use client";

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Calendar, 
  CreditCard, 
  MessageSquare, 
  Heart,
  LayoutDashboard,
  LogOut,
  Mic2,
  UserCircle,
  Rss
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { showSuccess } from '@/utils/toast';

const menuItems = [
  { icon: LayoutDashboard, label: 'Meu Painel', path: '/client' },
  { icon: UserCircle, label: 'Meu Perfil', path: '/client/profile' },
  { icon: Rss, label: 'Feed Social', path: '/client/feed' },
  { icon: Search, label: 'Buscar Artistas', path: '/client/discovery' },
  { icon: Calendar, label: 'Meus Eventos', path: '/client/events' },
  { icon: MessageSquare, label: 'Mensagens', path: '/client/messages' },
  { icon: Heart, label: 'Favoritos', path: '/client/favorites' },
  { icon: CreditCard, label: 'Pagamentos', path: '/client/payments' },
];

const ClientSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    showSuccess("Sessão encerrada.");
    navigate('/login');
  };

  return (
    <div className="w-64 bg-white h-screen flex flex-col text-slate-600 border-r fixed left-0 top-0 z-50 hidden md:flex">
      <div className="p-6 flex items-center gap-3 border-b">
        <div className="bg-blue-600 p-1.5 rounded-lg">
          <Mic2 className="text-white w-5 h-5" />
        </div>
        <span className="text-xl font-bold text-slate-900 tracking-tight">DUSHOW <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded ml-1 uppercase">Client</span></span>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              location.pathname === item.path 
                ? "bg-blue-50 text-blue-600 font-bold" 
                : "hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5",
              location.pathname === item.path ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
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

export default ClientSidebar;