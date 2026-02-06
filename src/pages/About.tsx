"use client";

import React from 'react';
import { Mic2, Shield, Zap, Users, Heart, Target, Award, CheckCircle2, Globe, Sparkles } from 'lucide-react';
import { Card } from "@/components/ui/card";
import PublicNavbar from '@/components/layout/PublicNavbar';
import Footer from '@/components/layout/Footer';

const About = () => {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      
      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6 bg-slate-900 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-indigo-400 text-xs font-black uppercase tracking-widest">
            <Sparkles className="w-4 h-4" />
            Nossa Missão
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.95]">
            O Palco Digital do <br />
            <span className="text-indigo-500">Setor de Eventos.</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Conectando talentos e contratantes de forma prática, segura e inovadora em toda a América Latina.
          </p>
        </div>
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600 rounded-full blur-[150px]"></div>
        </div>
      </section>

      {/* História & Fundador */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Nossa História</h2>
            <div className="space-y-6 text-slate-600 text-lg leading-relaxed">
              <p>
                A DUSHOW nasceu de uma necessidade real do mercado. Nosso fundador, <strong>Josef Jr</strong>, CEO da DUX Creative, percebeu a enorme dificuldade em encontrar e contratar profissionais qualificados com segurança.
              </p>
              <p className="p-6 bg-slate-50 border-l-4 border-indigo-600 rounded-r-2xl italic text-slate-700">
                “Quando percebi a dificuldade de encontrar profissionais qualificados para a minha equipe e os eventos que eu produzia, me veio a mente a ideia desta plataforma inovadora.”
              </p>
              <p>
                Hoje, somos a maior plataforma de conexão e confiança no mercado de eventos, unindo tecnologia de ponta, criatividade e uma comunidade vibrante de artistas.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-indigo-600/5 rounded-[3rem] blur-2xl"></div>
            <Card className="relative p-10 border-none shadow-2xl bg-white rounded-[3rem] space-y-8">
              <div className="grid grid-cols-1 gap-6">
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0 text-indigo-600">
                    <Target size={28} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900">Missão</h4>
                    <p className="text-slate-500">Valorizar profissionais e oferecer segurança total para contratantes através de tecnologia auditável.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0 text-amber-600">
                    <Award size={28} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900">Visão</h4>
                    <p className="text-slate-500">Ser o padrão global de contratação artística, eliminando burocracias e riscos financeiros.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0 text-emerald-600">
                    <Globe size={28} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900">Impacto</h4>
                    <p className="text-slate-500">Mais de 12 mil shows realizados e R$ 15 milhões transacionados com 100% de segurança.</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="bg-slate-50 py-24 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Nossos Valores</h2>
            <p className="text-slate-500 font-medium">O que nos guia todos os dias.</p>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-8">
            {[
              { icon: Shield, title: "Transparência", desc: "Contratos e pagamentos claros para todos." },
              { icon: Zap, title: "Valorização", desc: "Destaque para o talento real." },
              { icon: Users, title: "Comunidade", desc: "Crescimento colaborativo do setor." },
              { icon: Heart, title: "Paixão", desc: "Movidos por memórias espetaculares." },
              { icon: Mic2, title: "Inovação", desc: "Tecnologia simplificando a arte." },
            ].map((v, i) => (
              <div key={i} className="text-center space-y-4 p-8 bg-white rounded-[2.5rem] shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-indigo-600">
                  <v.icon size={32} />
                </div>
                <h4 className="font-black text-slate-900">{v.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;