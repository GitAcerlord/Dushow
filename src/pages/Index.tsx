"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mic2, ShieldCheck, Zap, Star, ArrowRight, 
  Play, CheckCircle2, Users, Globe, Sparkles,
  Music, Camera, Layout, Truck, Search, FileText,
  CreditCard, Award, Crown, ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PublicNavbar from '@/components/layout/PublicNavbar';
import Footer from '@/components/layout/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Index = () => {
  const stats = [
    { label: "Profissionais Ativos", value: "5.400+", icon: Users },
    { label: "Shows Realizados", value: "12.800+", icon: Mic2 },
    { label: "Avaliação Média", value: "4.9/5", icon: Star },
    { label: "Cidades Atendidas", value: "450+", icon: Globe },
  ];

  const categories = [
    { name: "Cantores", icon: Mic2, color: "bg-blue-500" },
    { name: "Bandas", icon: Music, color: "bg-indigo-500" },
    { name: "DJs", icon: Zap, color: "bg-purple-500" },
    { name: "Produção", icon: Layout, color: "bg-emerald-500" },
    { name: "Logística", icon: Truck, color: "bg-amber-500" },
  ];

  const steps = [
    { title: "Encontre o profissional", desc: "Filtre por categoria, preço e avaliação real.", icon: Search },
    { title: "Negocie e assine", desc: "Contratos digitais automáticos com validade jurídica.", icon: FileText },
    { title: "Pague com segurança", desc: "O valor fica em escrow e só é liberado após o show.", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-white selection:bg-indigo-100 selection:text-indigo-900">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-50 rounded-full blur-[120px] opacity-60"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-50 rounded-full blur-[120px] opacity-60"></div>
        </div>

        <div className="max-w-7xl mx-auto text-center space-y-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-black uppercase tracking-widest"
          >
            <Sparkles className="w-4 h-4" />
            A maior plataforma de eventos do Brasil
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.95] max-w-5xl mx-auto"
          >
            Contrate artistas com <span className="text-indigo-600">segurança</span> e contrato digital.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium"
          >
            Shows, festas e eventos corporativos sem dor de cabeça. Conectamos você aos melhores profissionais com garantia de entrega e pagamento.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6"
          >
            <Button size="lg" className="h-16 px-10 text-lg bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-2xl shadow-indigo-200 font-black group w-full sm:w-auto" asChild>
              <Link to="/client/discovery">
                Quero contratar um profissional
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-16 px-10 text-lg rounded-2xl border-slate-200 font-bold gap-2 w-full sm:w-auto" asChild>
              <Link to="/register">Sou artista / profissional</Link>
            </Button>
          </motion.div>

          {/* Stats Grid */}
          <div className="pt-24 grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {stats.map((stat, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-indigo-600">
                  <stat.icon size={20} />
                  <span className="text-3xl font-black text-slate-900">{stat.value}</span>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Categorias em Destaque</h2>
              <p className="text-slate-500 font-medium">Encontre o talento certo para cada tipo de palco.</p>
            </div>
            <Button variant="ghost" className="font-bold text-indigo-600 gap-2" asChild>
              <Link to="/client/discovery">Ver todos os profissionais <ChevronRight size={16} /></Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {categories.map((cat, i) => (
              <Card key={i} className="p-8 border-none shadow-sm bg-white rounded-[2.5rem] hover:shadow-xl hover:-translate-y-2 transition-all cursor-pointer group text-center">
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg", cat.color)}>
                  <cat.icon size={32} />
                </div>
                <h4 className="font-black text-slate-900">{cat.name}</h4>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <Badge className="bg-emerald-100 text-emerald-700 border-none px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[10px]">
              Segurança em Primeiro Lugar
            </Badge>
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-tight">
              Sua única preocupação será <span className="text-indigo-600">aproveitar o show.</span>
            </h2>
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-900 mb-2">Contrato Digital Nativo</h4>
                  <p className="text-slate-500 leading-relaxed">Cada contratação gera um contrato automático com validade jurídica, protegendo ambas as partes.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                  <CreditCard size={28} />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-900 mb-2">Pagamento em Escrow</h4>
                  <p className="text-slate-500 leading-relaxed">O valor fica retido na plataforma e só é liberado para o profissional após a confirmação da realização do evento.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                  <Star size={28} />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-900 mb-2">Avaliações Verificadas</h4>
                  <p className="text-slate-500 leading-relaxed">Apenas contratantes reais podem avaliar os profissionais, garantindo um histórico de reputação 100% confiável.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-indigo-600/5 rounded-[3rem] blur-2xl"></div>
            <Card className="relative p-10 border-none shadow-2xl bg-white rounded-[3rem] space-y-8">
              <div className="flex items-center gap-4 border-b pb-6">
                <div className="w-12 h-12 bg-slate-100 rounded-full overflow-hidden">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=DJAlok" alt="User" />
                </div>
                <div>
                  <p className="font-black text-slate-900">DJ Alok</p>
                  <div className="flex gap-1 text-amber-400"><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Status do Contrato</span>
                  <Badge className="bg-emerald-500">Assinado & Pago</Badge>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs text-slate-500 italic">"A plataforma me deu a segurança que eu precisava para fechar eventos em outras cidades sem medo de calote."</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 px-6 bg-slate-900 text-white rounded-[4rem] mx-6">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter">Como funciona a DUSHOW</h2>
            <p className="text-slate-400 font-medium">Simples, direto e seguro. Do orçamento ao palco.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -translate-y-1/2 z-0"></div>
            {steps.map((step, i) => (
              <div key={i} className="relative z-10 space-y-6 text-center group">
                <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-indigo-900/50 group-hover:scale-110 transition-transform">
                  <step.icon size={32} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-black">{step.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-[250px] mx-auto">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits for Professionals */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Card className="p-12 border-none shadow-xl bg-indigo-600 text-white rounded-[3rem] space-y-8">
            <h3 className="text-3xl font-black">Para Profissionais</h3>
            <div className="space-y-6">
              {[
                "Visibilidade para milhares de contratantes",
                "Agenda organizada e integrada",
                "Contratos automáticos com validade jurídica",
                "Pagamentos garantidos via plataforma",
                "Construção de reputação digital sólida"
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-3 font-bold">
                  <CheckCircle2 className="text-indigo-200 shrink-0" /> {b}
                </div>
              ))}
            </div>
            <Button className="bg-white text-indigo-600 hover:bg-slate-100 rounded-xl font-black w-full h-14" asChild>
              <Link to="/register">Criar Perfil Profissional</Link>
            </Button>
          </Card>

          <Card className="p-12 border-none shadow-xl bg-white rounded-[3rem] space-y-8 border border-slate-100">
            <h3 className="text-3xl font-black text-slate-900">Para Contratantes</h3>
            <div className="space-y-6">
              {[
                "Acesso a talentos verificados",
                "Facilidade de pagamento (PIX, Cartão, Boleto)",
                "Segurança total com sistema de Escrow",
                "Suporte especializado 24/7",
                "Gestão de múltiplos eventos em um só lugar"
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-3 font-bold text-slate-600">
                  <CheckCircle2 className="text-emerald-500 shrink-0" /> {b}
                </div>
              ))}
            </div>
            <Button className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-black w-full h-14" asChild>
              <Link to="/client/discovery">Contratar um Profissional</Link>
            </Button>
          </Card>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Planos & Vantagens</h2>
            <p className="text-slate-500 font-medium">Escolha o nível de destaque que sua carreira merece.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-10 border-none shadow-sm bg-white rounded-[3rem] space-y-8">
              <div>
                <h4 className="text-xl font-black text-slate-900">Gratuito</h4>
                <p className="text-slate-400 text-sm">Para quem está começando.</p>
              </div>
              <div className="text-4xl font-black text-slate-900">R$ 0</div>
              <ul className="space-y-4 text-sm font-medium text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Perfil Básico</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Contratos Digitais</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Taxa de Serviço 15%</li>
              </ul>
              <Button variant="outline" className="w-full rounded-xl font-bold" asChild><Link to="/register">Começar Grátis</Link></Button>
            </Card>

            <Card className="p-10 border-none shadow-2xl bg-white rounded-[3rem] space-y-8 ring-4 ring-indigo-600 relative scale-105 z-10">
              <Badge className="absolute top-6 right-6 bg-indigo-600">Mais Popular</Badge>
              <div>
                <h4 className="text-xl font-black text-slate-900">Pro</h4>
                <p className="text-slate-400 text-sm">Para profissionais em ascensão.</p>
              </div>
              <div className="text-4xl font-black text-slate-900">R$ 49,90<span className="text-sm text-slate-400">/mês</span></div>
              <ul className="space-y-4 text-sm font-medium text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Destaque nas Buscas</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Selo Verificado</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Taxa de Serviço 10%</li>
              </ul>
              <Button className="w-full bg-indigo-600 rounded-xl font-black" asChild><Link to="/register">Quero me destacar</Link></Button>
            </Card>

            <Card className="p-10 border-none shadow-sm bg-slate-900 text-white rounded-[3rem] space-y-8">
              <div>
                <h4 className="text-xl font-black">Premium</h4>
                <p className="text-slate-400 text-sm">Para os grandes nomes do mercado.</p>
              </div>
              <div className="text-4xl font-black">R$ 149,90<span className="text-sm text-slate-400">/mês</span></div>
              <ul className="space-y-4 text-sm font-medium text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-amber-500" /> Selo Superstar</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-amber-500" /> Topo Absoluto das Buscas</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-amber-500" /> Taxa de Serviço 7%</li>
              </ul>
              <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-black" asChild><Link to="/register">Seja Elite</Link></Button>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 max-w-3xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Dúvidas Frequentes</h2>
          <p className="text-slate-500 font-medium">Tudo o que você precisa saber para começar.</p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-b border-slate-100 py-2">
            <AccordionTrigger className="text-left font-bold text-slate-900 hover:text-indigo-600 transition-colors">É seguro contratar pela DUSHOW?</AccordionTrigger>
            <AccordionContent className="text-slate-500 leading-relaxed">
              Sim, 100% seguro. Utilizamos um sistema de Escrow onde o pagamento fica retido na plataforma e só é liberado para o profissional após a realização do evento. Além disso, todos os contratos possuem validade jurídica.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2" className="border-b border-slate-100 py-2">
            <AccordionTrigger className="text-left font-bold text-slate-900 hover:text-indigo-600 transition-colors">Como funciona o pagamento?</AccordionTrigger>
            <AccordionContent className="text-slate-500 leading-relaxed">
              Aceitamos PIX, Cartão de Crédito (com parcelamento) e Boleto Bancário. O processamento é feito através de gateways seguros e auditados.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3" className="border-b border-slate-100 py-2">
            <AccordionTrigger className="text-left font-bold text-slate-900 hover:text-indigo-600 transition-colors">Posso cancelar uma contratação?</AccordionTrigger>
            <AccordionContent className="text-slate-500 leading-relaxed">
              Sim, o cancelamento é regido pelas cláusulas de rescisão presentes no contrato digital assinado por ambas as partes no momento da negociação.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4" className="border-b border-slate-100 py-2">
            <AccordionTrigger className="text-left font-bold text-slate-900 hover:text-indigo-600 transition-colors">Como me torno um profissional verificado?</AccordionTrigger>
            <AccordionContent className="text-slate-500 leading-relaxed">
              Após criar seu perfil, você pode solicitar a verificação enviando seus documentos de identidade e portfólio. Nossa equipe de curadoria analisa cada perfil em até 48h.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-indigo-600 rounded-[4rem] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter">Transforme seus eventos em experiências inesquecíveis.</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-slate-100 h-16 px-10 rounded-2xl font-black text-lg w-full sm:w-auto" asChild>
                <Link to="/client/discovery">Contratar agora</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 h-16 px-10 rounded-2xl font-bold w-full sm:w-auto" asChild>
                <Link to="/register">Criar perfil profissional</Link>
              </Button>
            </div>
          </div>
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl"></div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;