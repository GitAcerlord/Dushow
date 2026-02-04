"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Star, MapPin, Filter, ShieldCheck, Award, Music, Loader2, Heart, PartyPopper, Cake, Baby
} from "lucide-react";
import { supabase } from '@/lib/supabase';

const Discovery = () => {
  const navigate = useNavigate();
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchArtists();
  }, [activeTab]);

  const fetchArtists = async () => {
    setLoading(true);
    try {
      let query = supabase.from('profiles').select('*').eq('role', 'PRO');
      
      if (activeTab !== 'all') {
        query = query.ilike('bio', `%${activeTab}%`); // Simulação de filtro por especialidade na bio
      }

      const { data, error } = await query.order('is_superstar', { ascending: false });

      if (error) throw error;
      setArtists(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArtists = artists.filter(a => 
    a.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Encontre o Talento Ideal</h1>
          <p className="text-slate-500 mt-1">Profissionais verificados para transformar seu evento.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              className="pl-10 bg-white border-slate-200 h-12 rounded-xl" 
              placeholder="Buscar por nome ou estilo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-12 rounded-xl gap-2 border-slate-200">
            <Filter className="w-4 h-4" /> Filtros
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border p-1 h-14 rounded-2xl w-full md:w-auto overflow-x-auto flex justify-start">
          <TabsTrigger value="all" className="rounded-xl px-6 gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <PartyPopper className="w-4 h-4" /> Todos
          </TabsTrigger>
          <TabsTrigger value="casamento" className="rounded-xl px-6 gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Heart className="w-4 h-4" /> Casamento
          </TabsTrigger>
          <TabsTrigger value="aniversario" className="rounded-xl px-6 gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Cake className="w-4 h-4" /> Aniversário
          </TabsTrigger>
          <TabsTrigger value="revelacao" className="rounded-xl px-6 gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Baby className="w-4 h-4" /> Chá Revelação
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin w-10 h-10 text-indigo-600" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredArtists.map((artist) => (
            <Card key={artist.id} className="group overflow-hidden border-none shadow-md hover:shadow-2xl transition-all duration-500 bg-white rounded-3xl">
              <div className="relative h-56 bg-slate-100 overflow-hidden">
                <img 
                  src={artist.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${artist.full_name}`} 
                  alt={artist.full_name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  {artist.is_superstar && (
                    <Badge className="bg-amber-500 border-none gap-1 shadow-lg">
                      <Crown className="w-3 h-3" /> Superstar
                    </Badge>
                  )}
                  {artist.is_verified && (
                    <Badge className="bg-blue-500 border-none gap-1 shadow-lg">
                      <ShieldCheck className="w-3 h-3" /> Verificado
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{artist.full_name}</h3>
                    <p className="text-xs text-indigo-600 font-bold flex items-center gap-1 uppercase tracking-wider">
                      <Music className="w-3 h-3" /> {artist.category || 'Artista'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 font-black">
                    <Star className="w-4 h-4 fill-current" />
                    {artist.rating || '5.0'}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-slate-400 text-xs mb-6">
                  <MapPin className="w-3 h-3" />
                  {artist.location || 'Brasil'}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-black">Cachê Base</p>
                    <p className="text-lg font-black text-slate-900">R$ {Number(artist.price).toLocaleString('pt-BR')}</p>
                  </div>
                  <Button 
                    onClick={() => navigate('/client/checkout', { state: { artist } })}
                    className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-6 font-bold shadow-lg shadow-indigo-100"
                  >
                    Contratar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Discovery;