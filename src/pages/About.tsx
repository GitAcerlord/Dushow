"use client";

import React from 'react';
import { Mic2, Shield, Zap, Users, Heart, Target, Award } from 'lucide-react';
import { Card } from "@/components/ui/card";

const About = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-indigo-600 py-24 text-white text-center px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight">O Palco Digital do Setor de Eventos</h1>
          <p className="text-xl text-indigo-100 leading-relaxed">
            Conectando talentos e contratantes de forma prática, segura e inovadora.
          </p>
        </div>
      </section>

      {/* História */}
      <section className="py-20 px-8 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-slate-900">Nossa História</h2>
            <p className="text-slate-600 leading-relaxed">
              A DUSHOW nasceu através de uma ideia do nosso fundador <strong>Josef Jr</strong>, CEO da DUX Creative. 
              “Quando percebi a dificuldade de encontrar profissionais qualificados para a minha equipe e os eventos que eu produzia, me veio a mente a ideia desta plataforma inovadora.”
            </p>
            <p className="text-slate-600 leading-relaxed">
              Hoje, somos a maior plataforma de conexão e confiança no mercado de eventos da América Latina, unindo tecnologia, criatividade e comunidade.
            </p>
          </div>
          <Card className="p-8 bg-white border-none shadow-2xl rounded-3xl">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
                  <Target className="text-indigo-600 w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Missão</h4>
                  <p className="text-sm text-slate-500">Valorizar profissionais e oferecer segurança total para contratantes.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Visão</h4>
                  <p className="text-sm text-slate-500">Ser a maior plataforma de conexão e confiança da América Latina.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Valores */}
      <section className="bg-white py-20 px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 text-center mb-16">Nossos Valores</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-8">
            {[
              { icon: Shield, title: "Transparência", desc: "Contratos e pagamentos claros." },
              { icon: Zap, title: "Valorização", desc: "Visibilidade para todos os talentos." },
              { icon: Users, title: "Comunidade", desc: "Espaço colaborativo de crescimento." },
              { icon: Heart, title: "Paixão", desc: "Movidos por memórias espetaculares." },
              { icon: Mic2, title: "Inovação", desc: "Tecnologia para simplificar o setor." },
            ].map((v, i) => (
              <div key={i} className="text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
                  <v.icon className="w-8 h-8 text-indigo-600" />
                </div>
                <h4 className="font-bold text-slate-900">{v.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;