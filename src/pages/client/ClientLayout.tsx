"use client";

import React from 'react';
import { Outlet } from 'react-router-dom';
import ClientSidebar from '@/components/client/ClientSidebar';
import { Bell, Search, User } from 'lucide-react';

const ClientLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <ClientSidebar />
      <main className="flex-1 ml-64">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="text-sm font-medium text-slate-500">
            Próximo Evento: <span className="text-indigo-600 font-bold">Sunset Party (em 12 dias)</span>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative text-slate-400 hover:text-blue-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">Clube Privilège</p>
                <p className="text-xs text-slate-500">Conta Empresarial</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                CP
              </div>
            </div>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
};

export default ClientLayout;