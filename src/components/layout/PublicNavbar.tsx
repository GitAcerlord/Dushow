"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Mic2, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const PublicNavbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#2D1B69]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 md:px-20 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-[#FFB703] p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-amber-500/20">
            <Mic2 className="text-[#2D1B69] w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white">DUSHOW</span>
        </Link>

        <div className="hidden md:flex items-center gap-10">
          <Link to="/services" className="text-sm font-bold text-white/70 hover:text-[#FFB703] transition-colors">Serviços</Link>
          <Link to="/about" className="text-sm font-bold text-white/70 hover:text-[#FFB703] transition-colors">Sobre Nós</Link>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="hidden sm:flex font-bold text-white/70 hover:text-white hover:bg-white/5">
            <Link to="/login">Entrar</Link>
          </Button>
          <Button className="bg-[#FFB703] hover:bg-[#e6a600] text-[#2D1B69] rounded-xl px-6 font-black shadow-lg shadow-amber-500/10" asChild>
            <Link to="/register">Criar Conta</Link>
          </Button>
          
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white"><Menu /></Button>
              </SheetTrigger>
              <SheetContent className="bg-[#2D1B69] border-none text-white">
                <div className="flex flex-col gap-8 mt-16">
                  <Link to="/services" className="text-2xl font-black">Serviços</Link>
                  <Link to="/about" className="text-2xl font-black">Sobre Nós</Link>
                  <hr className="border-white/10" />
                  <Link to="/login" className="text-2xl font-black">Entrar</Link>
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