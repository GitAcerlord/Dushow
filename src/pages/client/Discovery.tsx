"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Star, 
  MapPin, 
  Filter,
  ShieldCheck,
  Award,
  Music
} from "lucide-react";

const artists = [
  {
    id: 1,
    name: "DJ Alok",
    category: "Eletrônica",
    rating: 4.9,
    reviews: 128,
    price: 15000,
    location: "São Paulo, SP",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alok",
    verified: true,
    superstar: true
  },
  {
    id: 2,
    name: "Banda Jazz In",
    category: "Jazz / Blues",
    rating: 4.8,
    reviews: 45,
    price: 4500,
    location: "Rio de Janeiro, RJ",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jazz",
    verified: true,
    superstar: false
  },
  {
    id: 3,
    name: "Mariana Voz",
    category: "MPB / Acústico",
    rating: 5.0,
    reviews: 32,
    price: 2200,
    location: "Belo Horizonte, MG",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mariana",
    verified: false,
    superstar: false
  }
];

const Discovery = () => {
  const navigate = useNavigate();

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Encontre o Talento Ideal</h1>
          <p className="text-slate-500 mt-1">Milhares de artistas verificados prontos para o seu evento.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input className="pl-10 bg-white border-slate-200" placeholder="Buscar por nome ou estilo..." />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {['Todos', 'DJs', 'Bandas', 'Cantores Solo', 'Duplas', 'Instrumentistas'].map((cat) => (
          <Button key={cat} variant="ghost" className="rounded-full bg-white border shadow-sm hover:bg-indigo-50 hover:text-indigo-600 whitespace-nowrap">
            {cat}
          </Button>
        ))}
      </div>

      {/* Artist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {artists.map((artist) => (
          <Card key={artist.id} className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 bg-white">
            <div className="relative h-48 bg-slate-100 overflow-hidden">
              <img 
                src={artist.image} 
                alt={artist.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                {artist.superstar && (
                  <Badge className="bg-amber-500 hover:bg-amber-600 border-none gap-1">
                    <Award className="w-3 h-3" /> Superstar
                  </Badge>
                )}
                {artist.verified && (
                  <Badge className="bg-blue-500 hover:bg-blue-600 border-none gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verificado
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{artist.name}</h3>
                  <p className="text-sm text-indigo-600 font-medium flex items-center gap-1">
                    <Music className="w-3 h-3" /> {artist.category}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-current" />
                  {artist.rating}
                </div>
              </div>

              <div className="flex items-center gap-1 text-slate-500 text-sm mb-6">
                <MapPin className="w-3 h-3" />
                {artist.location}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold">Cachê a partir de</p>
                  <p className="text-lg font-bold text-slate-900">R$ {artist.price.toLocaleString('pt-BR')}</p>
                </div>
                <Button 
                  onClick={() => navigate('/client/checkout')}
                  className="bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  Contratar
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Discovery;