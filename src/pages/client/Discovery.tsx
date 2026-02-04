"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Star, 
  MapPin, 
  Filter,
  ShieldCheck,
  Award,
  Music,
  Loader2
} from "lucide-react";
import { supabase } from '@/lib/supabase';

const Discovery = () => {
  const navigate = useNavigate();
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'PRO')
        .order('is_superstar', { ascending: false });

      if (error) throw error;
      setArtists(data || []);
    } catch (error) {
      console.error("Erro ao buscar artistas:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArtists = artists.filter(a => 
    a.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <Input 
              className="pl-10 bg-white border-slate-200" 
              placeholder="Buscar por nome ou estilo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-6 space-y-4">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArtists.map((artist) => (
            <Card key={artist.id} className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 bg-white">
              <div className="relative h-48 bg-slate-100 overflow-hidden">
                <img 
                  src={artist.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${artist.full_name}`} 
                  alt={artist.full_name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  {artist.is_superstar && (
                    <Badge className="bg-amber-500 hover:bg-amber-600 border-none gap-1">
                      <Award className="w-3 h-3" /> Superstar
                    </Badge>
                  )}
                  {artist.is_verified && (
                    <Badge className="bg-blue-500 hover:bg-blue-600 border-none gap-1">
                      <ShieldCheck className="w-3 h-3" /> Verificado
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{artist.full_name}</h3>
                    <p className="text-sm text-indigo-600 font-medium flex items-center gap-1">
                      <Music className="w-3 h-3" /> {artist.category || 'Artista'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-4 h-4 fill-current" />
                    {artist.rating}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-slate-500 text-sm mb-6">
                  <MapPin className="w-3 h-3" />
                  {artist.location || 'Brasil'}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold">Cachê a partir de</p>
                    <p className="text-lg font-bold text-slate-900">R$ {Number(artist.price).toLocaleString('pt-BR')}</p>
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
      )}
    </div>
  );
};

export default Discovery;