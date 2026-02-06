"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CreditCard, 
  ShieldCheck, 
  Settings,
  LogOut,
  Mic2,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Users, label: 'Usuários', path: '/admin/users' },
  { icon: FileText, label: 'Contratos', path: '/admin/contracts' },
  { icon: MessageSquare, label: 'Mensagens', path: '/admin/messages' },
  { icon: CreditCard, label: 'Financeiro', path: '/admin/finance' },
  { icon: ShieldCheck, label: 'Aprovações', path: '/admin/approvals' },
  { icon: Settings, label: 'Configurações', path: '/admin/settings' },
];

const AdminSidebar = () => {
  const location = useLocation();

  return (
    <div className="w-64 bg-slate-900 h-screen flex flex-col text-slate-300 fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-indigo-600 p-1.5 rounded-lg">
          <Mic2 className="text-white w-5 h-5" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">DUSHOW <span className="text-[10px] bg-indigo-500 px-1.5 py-0.5 rounded ml-1">ADMIN</span></span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              location.pathname === item.path 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20" 
                : "hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5",
              location.pathname === item.path ? "text-white" : "text-slate-400 group-hover:text-white"
            )} />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors text-slate-400">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair do Painel</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;