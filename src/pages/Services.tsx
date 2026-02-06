"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ShieldCheck, Star, Zap, Crown, CheckCircle2, 
  ArrowRight, DollarSign, MessageSquare, Award
} from "lucide-react";
import { Link } from "react-router-dom";
import PublicNavbar from '@/components/layout/PublicNavbar';

const Services = () => {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-slate-900 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto text-center space-y-8 relative z-10">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
            Serviços que Impulsionam <br />
            <span className="text-indigo-400">Sua Carreira.</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium">
            Ferramentas profissionais para artistas que buscam o topo e contratantes que exigem excelência.
          </p>
        </div>
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600 rounded-full blur-[150px]"></div>
        </div>
      </section>

      {/* Main Services */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Selo Verificado */}
          <Card className="p-10 border-none shadow-2xl bg-white rounded-[3rem] space-y-8 group hover:-translate-y-2 transition-all">
            <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-slate-900">Selo Verificado</h3>
              <p className="text-slate-500 text-lg leading-relaxed">
                Aumente sua taxa de contratação em até 40%. O selo verificado confirma sua identidade e profissionalismo para todos os contratantes.
              </p>
              <ul className="space-y-3">
                {["Validação de Identidade", "Prioridade no Suporte", "Badge Exclusiva no Perfil"].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm font-bold text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-6 border-t flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Taxa Única</p>
                <p className="text-3xl font-black text-slate-900">R$ 49,90</p>
              </div>
              <Button className="bg-blue-600 rounded-xl font-bold" asChild>
                <Link to="/register">Obter Selo</Link>
              </Button>
            </div>
          </Card>

          {/* Selo Superstar */}
          <Card className="p-10 border-none shadow-2xl bg-slate-900 text-white rounded-[3rem] space-y-8 group hover:-translate-y-2 transition-all relative overflow-hidden">
            <div className="w-20 h-20 bg-amber-500 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
              <Crown className="w-10 h-10" />
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black">Selo Superstar</h3>
              <p className="text-slate-400 text-lg leading-relaxed">
                O nível máximo de prestígio. Apareça no topo de todas as buscas e tenha acesso a eventos exclusivos de alto orçamento.
              </p>
              <ul className="space-y-3">
                {["Destaque Máximo nas Buscas", "Taxas de Serviço Reduzidas", "Acesso ao DUSHOW Academy"].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm font-bold text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-amber-500" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-6 border-t border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Assinatura Mensal</p>
                <p className="text-3xl font-black text-white">R$ 149,90</p>
              </div>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold" asChild>
                <Link to="/register">Seja Superstar</Link>
              </Button>
            </div>
            <div className="absolute -right-10 -bottom-10 opacity-10">
              <Award className="w-40 h-40" />
            </div>
          </Card>
        </div>
      </section>

      {/* Platform Services */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-slate-900">Infraestrutura de Confiança</h2>
            <p className="text-slate-500 font-medium">O que torna a DUSHOW a escolha número 1 do mercado.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: DollarSign, title: "Gestão Financeira", desc: "Split de pagamentos automático e relatórios detalhados para sua contabilidade." },
              { icon: MessageSquare, title: "Chat Monitorado", desc: "Comunicação segura com filtros anti-bypass para proteger sua negociação." },
              { icon: Zap, title: "Gamificação", desc: "Ganhe XP por cada show e suba no ranking global de talentos da plataforma." }
            ].map((s, i) => (
              <div key={i} className="space-y-4 p-8 bg-white rounded-[2.5rem] shadow-sm">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <s.icon className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-black text-slate-900">{s.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center max-w-4xl mx-auto space-y-10">
        <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">Pronto para o próximo nível?</h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="h-16 px-10 bg-indigo-600 rounded-2xl font-black text-lg w-full sm:w-auto" asChild>
            <Link to="/register">Começar Agora</Link>
          </Button>
          <Button size="lg" variant="outline" className="h-16 px-10 rounded-2xl font-bold w-full sm:w-auto" asChild>
            <Link to="/about">Ver Planos Detalhados</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Services;