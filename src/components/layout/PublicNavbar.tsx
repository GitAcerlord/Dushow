"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Mic2, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const PublicNavbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-indigo-600 p-2 rounded-xl group-hover:rotate-12 transition-transform">
            <Mic2 className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-slate-900">DUSHOW</span>
        </Link>

        <div className="hidden md:flex items-center gap-10">
          <Link to="/services" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Serviços</Link>
          <Link to="/marketplace" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Marketplace</Link>
          <Link to="/about" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Sobre Nós</Link>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="hidden sm:flex font-bold text-slate-600">
            <Link to="/login">Entrar</Link>
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-6 font-bold shadow-lg shadow-indigo-100" asChild>
            <Link to="/register">Criar Conta</Link>
          </Button>
          
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Menu /></Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-6 mt-10">
                  <Link to="/services" className="text-lg font-bold">Serviços</Link>
                  <Link to="/marketplace" className="text-lg font-bold">Marketplace</Link>
                  <Link to="/about" className="text-lg font-bold">Sobre Nós</Link>
                  <hr />
                  <Link to="/login" className="text-lg font-bold">Entrar</Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PublicNavbar;