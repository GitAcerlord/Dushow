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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const Index = () => {
  const stats = [
    { label: "Profissionais Ativos", value: "+2.300", icon: Users },
    { label: "Eventos Realizados", value: "+5.800", icon: Mic2 },
    { label: "Avaliação Média", value: "4.9", icon: Star },
    { label: "Pagamentos Protegidos", value: "100%", icon: Lock },
  ];

  const categories = [
    { name: "Cantores & Bandas", icon: Mic2, desc: "Do acústico ao show de estádio." },
    { name: "DJs", icon: Zap, desc: "Open format, eletrônico e festas." },
    { name: "Produção de Eventos", icon: Layout, desc: "Cerimonialistas e produtores." },
    { name: "Estrutura & Logística", icon: Truck, desc: "Som, luz, palco e transporte." },
    { name: "Fotografia & Vídeo", icon: Camera, desc: "Eternize cada momento do show." },
    { name: "Serviços Complementares", icon: Sparkles, desc: "Buffet, segurança e mais." },
  ];

  const steps = [
    { id: "01", title: "Encontre o profissional ideal", desc: "Filtre por categoria, preço e avaliação real." },
    { id: "02", title: "Negocie, assine e pague", desc: "Contratos digitais e pagamento seguro em escrow." },
    { id: "03", title: "Realize seu evento", desc: "Foco total na experiência, nós cuidamos do resto." },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] selection:bg-purple-100 selection:text-[#6C2BD9]">
      <PublicNavbar />

      {/* 1. HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center pt-20 px-6 md:px-20 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8 z-10"
          >
            <Badge className="bg-purple-50 text-[#6C2BD9] border-purple-100 px-4 py-1.5 rounded-full font-bold uppercase tracking-widest text-[10px]">
              ✨ A maior plataforma de eventos do Brasil
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black text-[#0F172A] tracking-tighter leading-[1.1]">
              Contrate artistas e profissionais com <span className="text-[#6C2BD9]">segurança</span>
            </h1>
            <p className="text-xl text-[#64748B] max-w-lg leading-relaxed font-medium">
              Shows, festas e eventos sem dor de cabeça. Contrato digital, pagamento seguro e profissionais 100% verificados.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="h-16 px-10 text-lg bg-[#6C2BD9] hover:bg-[#5b24b8] rounded-2xl shadow-2xl shadow-purple-200 font-black group" asChild>
                <Link to="/client/discovery">
                  Quero contratar um profissional
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-16 px-10 text-lg rounded-2xl border-slate-200 font-bold gap-2 bg-white text-[#0F172A]" asChild>
                <Link to="/register">Sou artista / profissional</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative hidden lg:block"
          >
            <div className="absolute -inset-10 bg-[#6C2BD9]/5 rounded-full blur-3xl"></div>
            <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white rotate-2">
              <img 
                src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80" 
                alt="Show ao vivo" 
                className="w-full h-[600px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/60 to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#FFB703] flex items-center justify-center">
                    <Play className="text-white fill-current w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-white font-bold">Assista como funciona</p>
                    <p className="text-white/70 text-xs">Vídeo rápido de 45 segundos</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. PROVA SOCIAL */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 md:px-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-1">
                <div className="flex items-center gap-2 text-[#6C2BD9] mb-1">
                  <stat.icon size={20} />
                  <span className="text-3xl font-black text-[#0F172A]">{stat.value}</span>
                </div>
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. CATEGORIAS */}
      <section className="py-24 px-6 md:px-20">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-[#0F172A] tracking-tight">Tudo o que seu evento precisa</h2>
            <p className="text-[#64748B] font-medium">Encontre o talento certo para cada tipo de palco.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, i) => (
              <Card key={i} className="p-8 border-none shadow-sm bg-white rounded-[2.5rem] hover:shadow-xl hover:-translate-y-2 transition-all cursor-pointer group">
                <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-6 text-[#6C2BD9] group-hover:bg-[#6C2BD9] group-hover:text-white transition-colors">
                  <cat.icon size={32} />
                </div>
                <h4 className="text-xl font-black text-[#0F172A] mb-2">{cat.name}</h4>
                <p className="text-sm text-[#64748B] leading-relaxed mb-6">{cat.desc}</p>
                <div className="flex items-center text-[#6C2BD9] font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver profissionais <ChevronRight size={16} className="ml-1" />
                </div>
              </Card>
            ))}
          </div>
          
          <div className="text-center">
            <Button variant="ghost" className="font-bold text-[#6C2BD9] gap-2 hover:bg-purple-50" asChild>
              <Link to="/client/discovery">Ver todos os profissionais <ArrowRight size={16} /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 4. SEGURANÇA & CONFIANÇA */}
      <section className="py-24 px-6 md:px-20 bg-[#0F172A] text-white rounded-[4rem] mx-4 md:mx-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <Badge className="bg-[#22C55E]/10 text-[#22C55E] border-none px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[10px]">
              Segurança em Primeiro Lugar
            </Badge>
            <h2 className="text-5xl font-black tracking-tighter leading-tight">
              Sua única preocupação será <span className="text-[#FFB703]">aproveitar o show.</span>
            </h2>
            <div className="space-y-8">
              {[
                { icon: FileText, title: "Contrato Digital Nativo", desc: "Cada contratação gera um contrato automático com validade jurídica." },
                { icon: CreditCard, title: "Pagamento com Garantia", desc: "O valor fica retido em escrow e só é liberado após a realização do evento." },
                { icon: Star, title: "Avaliações Reais", desc: "Histórico completo e verificado de cada profissional na plataforma." }
              ].map((item, i) => (
                <div key={i} className="flex gap-6">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-[#FFB703] shrink-0 border border-white/10">
                    <item.icon size={28} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black mb-2">{item.title}</h4>
                    <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-10 bg-[#6C2BD9]/20 rounded-full blur-[100px]"></div>
            <Card className="relative p-10 border-none shadow-2xl bg-white rounded-[3rem] space-y-8 text-[#0F172A]">
              <div className="flex items-center justify-between border-b pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full overflow-hidden">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=DJAlok" alt="User" />
                  </div>
                  <div>
                    <p className="font-black">DJ Alok</p>
                    <div className="flex gap-1 text-[#FFB703]"><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /></div>
                  </div>
                </div>
                <Badge className="bg-[#22C55E] text-white">Verificado</Badge>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B] font-bold uppercase text-[10px]">Status do Contrato</span>
                  <span className="text-[#22C55E] font-black">ASSINADO & PAGO</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs text-[#64748B] italic">"A DUSHOW trouxe a segurança que faltava para o mercado. Hoje fecho shows em todo o Brasil com tranquilidade."</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. COMO FUNCIONA */}
      <section className="py-24 px-6 md:px-20">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black text-[#0F172A] tracking-tighter">Como funciona a DUSHOW</h2>
            <p className="text-[#64748B] font-medium">Simples, direto e seguro. Do orçamento ao palco.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {steps.map((step, i) => (
              <div key={i} className="relative space-y-6 text-center group">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-xl border border-slate-100 group-hover:border-[#6C2BD9] transition-colors">
                  <span className="text-3xl font-black text-[#6C2BD9]">{step.id}</span>
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-black text-[#0F172A]">{step.title}</h4>
                  <p className="text-[#64748B] text-sm leading-relaxed max-w-[250px] mx-auto">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. PLANOS & VANTAGENS */}
      <section className="py-24 px-6 md:px-20 bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-[#0F172A] tracking-tight">Planos & Vantagens</h2>
            <p className="text-[#64748B] font-medium">Escolha o nível de destaque que sua carreira merece.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free */}
            <Card className="p-10 border-none shadow-sm bg-white rounded-[3rem] space-y-8">
              <div>
                <h4 className="text-xl font-black text-[#0F172A]">Gratuito</h4>
                <p className="text-[#64748B] text-sm">Para quem está começando.</p>
              </div>
              <ul className="space-y-4 text-sm font-medium text-[#64748B]">
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#22C55E]" /> Perfil Básico</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#22C55E]" /> Contratos Digitais</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#22C55E]" /> Taxa de Serviço 15%</li>
              </ul>
              <Button variant="outline" className="w-full rounded-xl font-bold border-slate-200" asChild><Link to="/register">Começar Grátis</Link></Button>
            </Card>

            {/* Pro */}
            <Card className="p-10 border-none shadow-2xl bg-white rounded-[3rem] space-y-8 ring-4 ring-[#6C2BD9] relative scale-105 z-10">
              <Badge className="absolute top-6 right-6 bg-[#6C2BD9] text-white">Mais Popular</Badge>
              <div>
                <h4 className="text-xl font-black text-[#0F172A]">Pro</h4>
                <p className="text-[#64748B] text-sm">Para profissionais em ascensão.</p>
              </div>
              <ul className="space-y-4 text-sm font-medium text-[#64748B]">
                <li className="flex items-center gap-2 font-bold text-[#0F172A]"><CheckCircle2 size={16} className="text-[#22C55E]" /> Destaque nas Buscas</li>
                <li className="flex items-center gap-2 font-bold text-[#0F172A]"><CheckCircle2 size={16} className="text-[#22C55E]" /> Selo Verificado</li>
                <li className="flex items-center gap-2 font-bold text-[#0F172A]"><CheckCircle2 size={16} className="text-[#22C55E]" /> Taxa de Serviço 10%</li>
                <li className="flex items-center gap-2 font-bold text-[#0F172A]"><CheckCircle2 size={16} className="text-[#22C55E]" /> Agenda Integrada</li>
              </ul>
              <Button className="w-full bg-[#6C2BD9] hover:bg-[#5b24b8] rounded-xl font-black shadow-xl shadow-purple-100" asChild><Link to="/register">Quero me destacar</Link></Button>
            </Card>

            {/* Premium */}
            <Card className="p-10 border-none shadow-sm bg-[#0F172A] text-white rounded-[3rem] space-y-8">
              <div>
                <h4 className="text-xl font-black">Premium</h4>
                <p className="text-slate-400 text-sm">Para os grandes nomes do mercado.</p>
              </div>
              <ul className="space-y-4 text-sm font-medium text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#FFB703]" /> Selo Superstar</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#FFB703]" /> Topo Absoluto das Buscas</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#FFB703]" /> Taxa de Serviço 7%</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#FFB703]" /> Suporte VIP 24h</li>
              </ul>
              <Button className="w-full bg-white text-[#0F172A] hover:bg-slate-100 rounded-xl font-black" asChild><Link to="/register">Seja Elite</Link></Button>
            </Card>
          </div>
        </div>
      </section>

      {/* 10. CTA FINAL */}
      <section className="py-24 px-6 md:px-20">
        <div className="max-w-5xl mx-auto bg-[#6C2BD9] rounded-[4rem] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-purple-200">
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter">Transforme seus eventos em experiências inesquecíveis.</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="bg-[#FFB703] text-[#0F172A] hover:bg-[#e6a600] h-16 px-10 rounded-2xl font-black text-lg w-full sm:w-auto shadow-xl shadow-amber-900/20" asChild>
                <Link to="/client/discovery">Contratar agora</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 h-16 px-10 rounded-2xl font-bold w-full sm:w-auto" asChild>
                <Link to="/register">Criar perfil profissional</Link>
              </Button>
            </div>
          </div>
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl"></div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;