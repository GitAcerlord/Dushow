"use client";

import React from 'react';
import { Outlet } from 'react-router-dom';
import ProSidebar from '@/components/pro/ProSidebar';
import { Bell, Search } from 'lucide-react';

const ProLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <ProSidebar />
      <main className="flex-1 ml-64">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar eventos ou contratantes..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-6">
            <button className="relative text-slate-400 hover:text-indigo-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">DJ Alok</p>
                <p className="text-xs text-emerald-600 font-medium">Plano Superstar</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alok" alt="Avatar" />
              </div>
            </div>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
};

export default ProLayout;