"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  MapPin, 
  Music, 
  Instagram, 
  Youtube, 
  Globe, 
  Edit3,
  Camera,
  CheckCircle2,
  Award,
  Settings,
  Share2
} from "lucide-react";

const MOCK_PORTFOLIO = [
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80",
  "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400&q=80",
  "https://images.unsplash.com/photo-1514525253361-bee8718a74a2?w=400&q=80",
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80",
];

const ProProfile = () => {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header Card */}
      <Card className="p-8 border-none shadow-sm bg-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-10"></div>
        
        <div className="relative flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-xl">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alok" alt="Profile" className="w-full h-full object-cover" />
            </div>
            <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-full shadow-md text-slate-400 hover:text-indigo-600 transition-colors">
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900">DJ Alok</h1>
              <div className="flex gap-2">
                <Badge className="bg-blue-500 hover:bg-blue-600 border-none gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verificado
                </Badge>
                <Badge className="bg-amber-500 hover:bg-amber-600 border-none gap-1">
                  <Award className="w-3 h-3" /> Superstar
                </Badge>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Music className="w-4 h-4 text-indigo-600" /> Eletrônica / House
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-600" /> São Paulo, SP
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-current" /> 4.9 (128 avaliações)
              </span>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none gap-2">
              <Share2 className="w-4 h-4" /> Compartilhar
            </Button>
            <Button className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 gap-2">
              <Edit3 className="w-4 h-4" /> Editar Perfil
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Bio */}
          <Card className="p-6 border-none shadow-sm bg-white">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Sobre o Artista</h3>
            <p className="text-slate-600 leading-relaxed">
              Com mais de 10 anos de estrada, Alok é referência na cena eletrônica nacional. 
              Especialista em criar atmosferas únicas para casamentos, eventos corporativos e festivais. 
              Seu setlist é personalizado para cada evento, garantindo pista cheia do início ao fim.
            </p>
          </Card>

          {/* Portfolio Gallery */}
          <Card className="p-6 border-none shadow-sm bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Portfólio Visual</h3>
              <Button variant="ghost" size="sm" className="text-indigo-600 font-bold">Ver Tudo</Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {MOCK_PORTFOLIO.map((img, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-slate-100 group relative cursor-pointer">
                  <img src={img} alt={`Portfolio ${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Settings className="text-white w-6 h-6" />
                  </div>
                </div>
              ))}
              <button className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all">
                <Plus className="w-6 h-6 mb-1" />
                <span className="text-xs font-bold">Add Foto</span>
              </button>
            </div>
          </Card>

          {/* Rider Técnico */}
          <Card className="p-6 border-none shadow-sm bg-white">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Rider Técnico & Equipamentos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Equipamento Próprio</p>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 2x CDJ 2000 Nexus 2</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Mixer DJM 900 Nexus 2</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Sistema de Som RCF (até 200 pessoas)</li>
                </ul>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Exigências do Local</p>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Ponto de energia 220v dedicado</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Mesa/Suporte estável (mín. 1.5m)</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Acesso para carga/descarga</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Stats & Social */}
        <div className="space-y-8">
          <Card className="p-6 border-none shadow-sm bg-white">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Estatísticas</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Shows Realizados</span>
                <span className="font-bold text-slate-900">142</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Taxa de Resposta</span>
                <span className="font-bold text-emerald-600">98%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Tempo Médio</span>
                <span className="font-bold text-slate-900">15 min</span>
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs text-slate-400 uppercase font-bold mb-3">Redes Sociais</p>
                <div className="flex gap-3">
                  <Button variant="ghost" size="icon" className="rounded-full bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600">
                    <Instagram className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full bg-slate-50 hover:bg-red-50 hover:text-red-600">
                    <Youtube className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full bg-slate-50 hover:bg-blue-50 hover:text-blue-600">
                    <Globe className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-sm bg-indigo-600 text-white">
            <h3 className="text-lg font-bold mb-2">Destaque seu Perfil</h3>
            <p className="text-indigo-100 text-sm mb-6">
              Artistas com portfólio completo e rider técnico detalhado fecham 3x mais contratos.
            </p>
            <Button variant="secondary" className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-bold">
              Completar Perfil
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

import { Plus } from 'lucide-react';
export default ProProfile;