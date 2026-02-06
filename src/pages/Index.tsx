"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Mic2, ShieldCheck, Zap, Star, ArrowRight, 
  Play, CheckCircle2, Users, Globe, Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import PublicNavbar from '@/components/layout/PublicNavbar';

const Index = () => {
  return (
    <div className="min-h-screen bg-white selection:bg-indigo-100 selection:text-indigo-900">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] opacity-50"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-50 rounded-full blur-[120px] opacity-50"></div>
        </div>

        <div className="max-w-7xl mx-auto text-center space-y-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-black uppercase tracking-widest animate-fade-in">
            <Sparkles className="w-4 h-4" />
            A Revolução do Mercado de Eventos
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9] max-w-5xl mx-auto">
            Onde o Talento Encontra o <span className="text-indigo-600">Palco Perfeito.</span>
          </h1>
          
          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
            A DUSHOW é a plataforma definitiva para artistas e contratantes. 
            Segurança total, contratos inteligentes e visibilidade sem fronteiras.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Button size="lg" className="h-16 px-10 text-lg bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-2xl shadow-indigo-200 font-black group" asChild>
              <Link to="/register">
                Começar Agora 
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-16 px-10 text-lg rounded-2xl border-slate-200 font-bold gap-2" asChild>
              <Link to="/services"><Play className="w-5 h-5 fill-current" /> Ver Como Funciona</Link>
            </Button>
          </div>

          <div className="pt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto opacity-50 grayscale">
            <div className="flex items-center justify-center font-black text-2xl">SONY MUSIC</div>
            <div className="flex items-center justify-center font-black text-2xl">WARNER</div>
            <div className="flex items-center justify-center font-black text-2xl">UNIVERSAL</div>
            <div className="flex items-center justify-center font-black text-2xl">DUX CREATIVE</div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Construído para a Nova Era</h2>
            <p className="text-slate-500 font-medium">Tecnologia de ponta para quem vive de arte e eventos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 p-10 border-none shadow-sm bg-white rounded-[3rem] flex flex-col justify-between group hover:shadow-xl transition-all">
              <div className="space-y-4">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-black text-slate-900">Pagamento em Escrow</h3>
                <p className="text-slate-500 text-lg leading-relaxed">
                  O dinheiro do contratante fica seguro e só é liberado para o artista após a realização do show. 
                  Risco zero para ambas as partes.
                </p>
              </div>
              <div className="mt-10 h-40 bg-slate-50 rounded-3xl border border-dashed border-slate-200 flex items-center justify-center">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white rounded-full shadow-sm"></div>
                  <div className="w-32 h-4 bg-slate-200 rounded-full mt-4"></div>
                </div>
              </div>
            </Card>

            <Card className="p-10 border-none shadow-sm bg-indigo-600 text-white rounded-[3rem] flex flex-col justify-between group hover:scale-[1.02] transition-all">
              <div className="space-y-4">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-black">Contratos Digitais</h3>
                <p className="text-indigo-100 leading-relaxed">
                  Gere contratos juridicamente válidos em segundos. Assinatura digital integrada e auditoria completa.
                </p>
              </div>
              <Button variant="secondary" className="mt-10 rounded-xl font-bold">Saiba Mais</Button>
            </Card>

            <Card className="p-10 border-none shadow-sm bg-white rounded-[3rem] group hover:shadow-xl transition-all">
              <div className="space-y-4">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                  <Star className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Sistema de Selos</h3>
                <p className="text-slate-500 leading-relaxed">
                  Destaque-se com os selos Verificado e Superstar. Aumente sua credibilidade e conquiste mais contratantes.
                </p>
              </div>
            </Card>

            <Card className="md:col-span-2 p-10 border-none shadow-sm bg-slate-900 text-white rounded-[3rem] flex flex-col md:flex-row gap-10 items-center group hover:shadow-2xl transition-all">
              <div className="space-y-4 flex-1">
                <h3 className="text-3xl font-black">Marketplace de Equipamentos</h3>
                <p className="text-slate-400 leading-relaxed">
                  Compre e venda instrumentos, som e iluminação com a garantia DUSHOW. Intermediação segura para o seu setup.
                </p>
                <Button className="bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold">Explorar Loja</Button>
              </div>
              <div className="w-full md:w-64 aspect-square bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center">
                <Mic2 className="w-20 h-20 text-white/20" />
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-indigo-600 rounded-[4rem] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter">Pronto para elevar o nível dos seus eventos?</h2>
            <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
              Junte-se a milhares de artistas e contratantes que já transformaram sua forma de trabalhar.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-slate-100 h-16 px-10 rounded-2xl font-black text-lg w-full sm:w-auto" asChild>
                <Link to="/register">Criar Minha Conta Grátis</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 h-16 px-10 rounded-2xl font-bold w-full sm:w-auto" asChild>
                <Link to="/about">Falar com Consultor</Link>
              </Button>
            </div>
          </div>
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Mic2 className="text-white w-4 h-4" />
              </div>
              <span className="text-xl font-black text-slate-900">DUSHOW</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              A maior plataforma de conexão artística da América Latina. Tecnologia a serviço da arte.
            </p>
          </div>
          <div>
            <h4 className="font-black text-slate-900 mb-6">Plataforma</h4>
            <ul className="space-y-4 text-sm text-slate-500 font-medium">
              <li><Link to="/services" className="hover:text-indigo-600">Serviços</Link></li>
              <li><Link to="/marketplace" className="hover:text-indigo-600">Marketplace</Link></li>
              <li><Link to="/about" className="hover:text-indigo-600">Sobre Nós</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-slate-900 mb-6">Suporte</h4>
            <ul className="space-y-4 text-sm text-slate-500 font-medium">
              <li><a href="#" className="hover:text-indigo-600">Central de Ajuda</a></li>
              <li><a href="#" className="hover:text-indigo-600">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-indigo-600">Privacidade</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-slate-900 mb-6">Newsletter</h4>
            <div className="flex gap-2">
              <input type="email" placeholder="Seu e-mail" className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm w-full" />
              <Button className="bg-indigo-600 rounded-xl">OK</Button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-12 mt-12 border-t border-slate-100 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
          © 2024 DUSHOW SAAS • MADE WITH PASSION FOR ARTISTS
        </div>
      </footer>
    </div>
  );
};

export default Index;