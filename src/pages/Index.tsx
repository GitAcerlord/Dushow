"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mic2, ShieldCheck, Zap, Star, ArrowRight, 
  Play, CheckCircle2, Users, Globe, Sparkles,
  Music, Camera, Layout, Truck, Search, FileText,
  CreditCard, Award, Crown, ChevronRight, Video,
  Heart, MessageSquare, Lock
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PublicNavbar from '@/components/layout/PublicNavbar';
import Footer from '@/components/layout/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] selection:bg-purple-100 selection:text-[#2D1B69]">
      <PublicNavbar />

      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center pt-20 px-6 md:px-20 overflow-hidden bg-[#2D1B69]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <Badge className="bg-[#FFB703] text-[#2D1B69] border-none px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[10px]">
              ✨ A maior plataforma de eventos do Brasil
            </Badge>
            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-[0.95]">
              O Palco da sua <br />
              <span className="text-[#FFB703]">Próxima Atração.</span>
            </h1>
            <p className="text-xl text-white/70 max-w-lg leading-relaxed font-medium">
              Conectamos artistas e contratantes com segurança total, contratos digitais e pagamentos protegidos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="h-16 px-10 text-lg bg-[#FFB703] hover:bg-[#e6a600] text-[#2D1B69] rounded-2xl shadow-2xl shadow-amber-900/20 font-black group" asChild>
                <Link to="/app/discovery">
                  Contratar Artista
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-16 px-10 text-lg rounded-2xl border-white/20 font-bold gap-2 bg-white/5 text-white hover:bg-white/10" asChild>
                <Link to="/register">Sou Profissional</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative hidden lg:block"
          >
            <div className="absolute -inset-20 bg-[#FFB703]/10 rounded-full blur-[120px]"></div>
            <div className="relative rounded-[4rem] overflow-hidden shadow-2xl border-[12px] border-white/5 rotate-2">
              <img 
                src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80" 
                alt="Show ao vivo" 
                className="w-full h-[650px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2D1B69]/80 to-transparent"></div>
            </div>
          </motion.div>
        </div>
        
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[#FFB703]/5 blur-[150px] -z-0"></div>
      </section>

      {/* STATS */}
      <section className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 md:px-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { label: "Artistas Ativos", value: "+2.300", icon: Users },
              { label: "Shows Realizados", value: "+5.800", icon: Mic2 },
              { label: "Avaliação Média", value: "4.9", icon: Star },
              { label: "Segurança", value: "100%", icon: Lock },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 bg-[#2D1B69]/5 rounded-2xl flex items-center justify-center text-[#2D1B69]">
                  <stat.icon size={24} />
                </div>
                <span className="text-4xl font-black text-[#2D1B69]">{stat.value}</span>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-32 px-6 md:px-20">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-black text-[#2D1B69] tracking-tight">Tudo para o seu evento</h2>
            <p className="text-slate-500 font-medium text-lg">Encontre o talento certo para cada tipo de palco.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: "Cantores & Bandas", icon: Mic2, desc: "Do acústico ao show de estádio." },
              { name: "DJs & Eletrônico", icon: Zap, desc: "Open format e festas exclusivas." },
              { name: "Produção Técnica", icon: Layout, desc: "Som, luz e estrutura completa." },
            ].map((cat, i) => (
              <Card key={i} className="p-10 border-none shadow-sm bg-white rounded-[3rem] hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group">
                <div className="w-20 h-20 rounded-[2rem] bg-[#2D1B69]/5 flex items-center justify-center mb-8 text-[#2D1B69] group-hover:bg-[#2D1B69] group-hover:text-white transition-all">
                  <cat.icon size={36} />
                </div>
                <h4 className="text-2xl font-black text-[#2D1B69] mb-3">{cat.name}</h4>
                <p className="text-slate-500 leading-relaxed mb-8">{cat.desc}</p>
                <div className="flex items-center text-[#FFB703] font-black text-sm">
                  Explorar <ChevronRight size={18} className="ml-1" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;