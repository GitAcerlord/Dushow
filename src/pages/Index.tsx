"use client";

import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Mic2, 
  Calendar, 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  Star,
  ArrowRight
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          if (profile.role === 'ADMIN') navigate('/admin');
          else if (profile.role === 'CLIENT') navigate('/client');
          else navigate('/pro');
        }
      }
    };
    checkUser();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 bg-white border-b sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Mic2 className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">DUSHOW</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-indigo-600 transition-colors">Funcionalidades</a>
          <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">Como Funciona</a>
          <Link to="/marketplace" className="hover:text-indigo-600 transition-colors">Marketplace</Link>
          <Link to="/about" className="hover:text-indigo-600 transition-colors">Sobre</Link>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link to="/login">Entrar</Link>
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700" asChild>
            <Link to="/register">Começar Agora</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-8 py-24 md:py-32 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-6">
          <Star className="w-4 h-4 fill-current" />
          <span>A maior plataforma de contratação artística do Brasil</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-8 tracking-tight">
          O show não pode parar. <br />
          <span className="text-indigo-600">Nós conectamos o talento.</span>
        </h1>
        <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          A plataforma completa para profissionais da música e contratantes. 
          Gestão de contratos, pagamentos seguros e visibilidade real.
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <Button size="lg" className="h-14 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 w-full md:w-auto" asChild>
            <Link to="/register">Sou Profissional <ArrowRight className="ml-2 w-5 h-5" /></Link>
          </Button>
          <Button size="lg" variant="outline" className="h-14 px-8 text-lg w-full md:w-auto" asChild>
            <Link to="/register">Quero Contratar</Link>
          </Button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-20 border-y">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Artistas", value: "12k+" },
            { label: "Eventos Realizados", value: "45k+" },
            { label: "Pagos em Cachê", value: "R$ 15M+" },
            { label: "Avaliação Média", value: "4.9/5" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-sm text-slate-500 uppercase tracking-wider mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-8 py-24 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Tudo o que você precisa em um só lugar</h2>
          <p className="text-slate-600">Segurança, agilidade e transparência para o mercado de eventos.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-8 border-none shadow-sm bg-white hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
              <ShieldCheck className="text-blue-600 w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Pagamento Seguro</h3>
            <p className="text-slate-600 leading-relaxed">
              Sistema de Escrow que garante o pagamento ao artista e a entrega ao contratante.
            </p>
          </Card>
          <Card className="p-8 border-none shadow-sm bg-white hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-6">
              <Calendar className="text-purple-600 w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Agenda Inteligente</h3>
            <p className="text-slate-600 leading-relaxed">
              Sincronização em tempo real. Evite conflitos de datas e gerencie propostas de forma automatizada.
            </p>
          </Card>
          <Card className="p-8 border-none shadow-sm bg-white hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-6">
              <TrendingUp className="text-orange-600 w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Gamificação</h3>
            <p className="text-slate-600 leading-relaxed">
              Ganhe pontos por engajamento, suba no ranking e conquiste selos de Verificado e Superstar.
            </p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Mic2 className="text-white w-6 h-6" />
            <span className="text-xl font-bold text-white">DUSHOW</span>
          </div>
          <div className="flex gap-8 text-sm">
            <a href="#" className="hover:text-white">Termos de Uso</a>
            <a href="#" className="hover:text-white">Privacidade</a>
            <a href="#" className="hover:text-white">Ajuda</a>
          </div>
          <p className="text-sm">© 2024 DUSHOW SaaS. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;