"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, MapPin, Music, Loader2, Trash2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id,
        artist:profiles!favorites_artist_id_fkey(*)
      `)
      .eq('user_id', user.id);

    if (error) {
      showError("Erro ao carregar favoritos.");
    } else {
      setFavorites(data || []);
    }
    setLoading(false);
  };

  const removeFavorite = async (favId: string) => {
    const { error } = await supabase.from('favorites').delete().eq('id', favId);
    if (!error) {
      setFavorites(favorites.filter(f => f.id !== favId));
      showSuccess("Removido dos favoritos.");
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Meus Favoritos</h1>
        <p className="text-slate-500">Artistas que você salvou para seus próximos eventos.</p>
      </div>

      {favorites.length === 0 ? (
        <Card className="p-20 text-center border-dashed border-2 space-y-4">
          <Heart className="w-12 h-12 text-slate-200 mx-auto" />
          <p className="text-slate-500 font-medium">Sua lista de favoritos está vazia.</p>
          <Button asChild className="bg-blue-600">
            <button onClick={() => navigate('/client/discovery')}>Explorar Artistas</button>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((fav) => (
            <Card key={fav.id} className="group overflow-hidden border-none shadow-md bg-white rounded-3xl">
              <div className="relative h-48 bg-slate-100">
                <img 
                  src={fav.artist.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fav.artist.full_name}`} 
                  className="w-full h-full object-cover"
                />
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-3 right-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFavorite(fav.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-5 space-y-3">
                <h3 className="font-bold text-slate-900">{fav.artist.full_name}</h3>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-blue-600 font-bold uppercase">{fav.artist.category}</span>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-3 h-3 fill-current" /> {fav.artist.rating}
                  </div>
                </div>
                <Button 
                  className="w-full bg-slate-900 rounded-xl"
                  onClick={() => navigate('/client/checkout', { state: { artist: fav.artist } })}
                >
                  Contratar Agora
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;