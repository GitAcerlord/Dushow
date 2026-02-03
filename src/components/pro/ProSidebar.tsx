"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserCircle, 
  MessageSquare, 
  Calendar,
  Trophy,
  CreditCard,
  Sparkles,
  LogOut,
  Mic2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Meu Painel', path: '/pro' },
  { icon: UserCircle, label: 'Meu Perfil', path: '/pro/profile' },
  { icon: MessageSquare, label: 'Feed Social', path: '/pro/feed' },
  { icon: Calendar, label: 'Minha Agenda', path: '/pro/agenda' },
  { icon: Trophy, label: 'Conquistas', path: '/pro/achievements' },
  { icon: Sparkles, label: 'Planos & Upgrade', path: '/pro/plans' },
  { icon: CreditCard, label: 'Financeiro', path: '/pro/finance' },
];

const ProSidebar = () => {
  const location = useLocation();

  return (
    <div className="w-64 bg-white h-screen flex flex-col text-slate-600 border-r fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3 border-b">
        <div className="bg-indigo-600 p-1.5 rounded-lg">
          <Mic2 className="text-white w-5 h-5" />
        </div>
        <span className="text-xl font-bold text-slate-900 tracking-tight">DUSHOW <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded ml-1 uppercase">Pro</span></span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
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
        <div className="bg-slate-50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Nível 12</span>
            <span className="text-xs font-bold text-indigo-600">1.250 pts</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div className="bg-indigo-600 h-1.5 rounded-full w-[65%]"></div>
          </div>
        </div>
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors text-slate-400">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </div>
  );
};

export default ProSidebar;