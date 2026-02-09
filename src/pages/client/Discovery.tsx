"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Star, MapPin, Heart, Loader2, Crown, Calendar, DollarSign, Music, User, ArrowRight
} from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { getSafeImageUrl } from '@/utils/url-validator';
import { cn } from '@/lib/utils';

const Discovery = () => {
  const navigate = useNavigate();
  const [artists, setArtists] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [proposalData, setProposalData] = useState({
    eventName: "",
    eventDate: "",
    location: ""
  });

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    if (user) {
      const { data: favs } = await supabase.from('favorites').select('artist_id').eq('user_id', user.id);
      setFavorites(favs?.map(f => f.artist_id) || []);
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'PRO')
      .eq('is_active', true)
      .order('is_superstar', { ascending: false });
    
    setArtists(data || []);
    setLoading(false);
  };

  const toggleFavorite = async (artistId: string) => {
    if (!currentUser) return navigate('/login');

    const isFav = favorites.includes(artistId);
    try {
      if (isFav) {
        await supabase.from('favorites').delete().eq('user_id', currentUser.id).eq('artist_id', artistId);
        setFavorites(prev => prev.filter(id => id !== artistId));
        showSuccess("Removido dos favoritos.");
      } else {
        await supabase.from('favorites').insert({ user_id: currentUser.id, artist_id: artistId });
        setFavorites(prev => [...prev, artistId]);
        showSuccess("Adicionado aos favoritos!");
      }
    } catch (e) {
      showError("Erro ao atualizar favoritos.");
    }
  };

  const handleSendProposal = async () => {
    if (!proposalData.eventName || !proposalData.eventDate) {
      showError("Preencha os dados do evento.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-contract', {
        body: {
          proId: selectedArtist.id,
          eventName: proposalData.eventName,
          eventDate: proposalData.eventDate,
          location: proposalData.location
        }
      });

      if (error) throw error;

      showSuccess(`Proposta enviada para ${selectedArtist.full_name}!`);
      setSelectedArtist(null);
      navigate('/client/events');
    } catch (error: any) {
      showError(error.message || "Erro ao enviar proposta.");
    } finally {
      setIsSubmitting(false);
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
          <h1 className="text-3xl font-black text-slate-900">Descobrir Talentos</h1>
          <p className="text-slate-500">Encontre os melhores profissionais para o seu palco.</p>
        </div>
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input 
            className="pl-10 bg-white rounded-xl border-slate-200" 
            placeholder="Nome, estilo ou categoria..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredArtists.map((artist) => (
            <Card key={artist.id} className="group overflow-hidden border-none shadow-sm bg-white rounded-[2rem] hover:shadow-xl transition-all duration-300">
              <div className="h-56 bg-slate-100 relative overflow-hidden">
                <img 
                  src={getSafeImageUrl(artist.avatar_url, `https://api.dicebear.com/7.x/avataaars/svg?seed=${artist.full_name}`)} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  alt={artist.full_name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {artist.is_superstar && <Badge className="bg-amber-500 border-none shadow-lg"><Crown className="w-3 h-3 mr-1" /> Superstar</Badge>}
                  {artist.is_verified && <Badge className="bg-blue-500 border-none shadow-lg"><Star className="w-3 h-3 mr-1 fill-current" /> Verificado</Badge>}
                </div>
                
                <Button 
                  variant="secondary" 
                  size="icon" 
                  onClick={() => toggleFavorite(artist.id)}
                  className={cn(
                    "absolute top-3 right-3 rounded-full backdrop-blur-md border-none transition-all",
                    favorites.includes(artist.id) ? "bg-red-500 text-white" : "bg-white/20 text-white hover:bg-white hover:text-red-500"
                  )}
                >
                  <Heart className={cn("w-4 h-4", favorites.includes(artist.id) && "fill-current")} />
                </Button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-black text-xl text-slate-900 truncate">{artist.full_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] font-bold uppercase border-blue-100 text-blue-600 bg-blue-50">
                      <Music className="w-3 h-3 mr-1" /> {artist.category || "Artista"}
                    </Badge>
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                      <Star className="w-3 h-3 fill-current" /> {artist.rating || "5.0"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {artist.location || "Local não informado"}
                </div>

                <div className="pt-2 flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-xl border-slate-200 font-bold text-xs"
                    onClick={() => navigate(`/client/artist/${artist.id}`)}
                  >
                    Ver Perfil
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button onClick={() => setSelectedArtist(artist)} className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-xs gap-2">
                        Contratar <ArrowRight className="w-3 h-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[2.5rem] max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Solicitar Proposta</DialogTitle>
                        <p className="text-slate-500 text-sm">Você está iniciando uma negociação com <strong>{artist.full_name}</strong>.</p>
                      </DialogHeader>
                      <div className="space-y-4 py-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase text-slate-400">Nome do Evento</Label>
                          <Input 
                            value={proposalData.eventName} 
                            onChange={(e) => setProposalData({...proposalData, eventName: e.target.value})} 
                            placeholder="Ex: Casamento de Ana & Leo" 
                            className="bg-slate-50 border-none h-12 rounded-xl"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-400">Data e Hora</Label>
                            <Input 
                              type="datetime-local" 
                              value={proposalData.eventDate} 
                              onChange={(e) => setProposalData({...proposalData, eventDate: e.target.value})} 
                              className="bg-slate-50 border-none h-12 rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-400">Localização</Label>
                            <Input 
                              value={proposalData.location} 
                              onChange={(e) => setProposalData({...proposalData, location: e.target.value})} 
                              placeholder="Cidade, Estado" 
                              className="bg-slate-50 border-none h-12 rounded-xl"
                            />
                          </div>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                          <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Cachê Base do Artista</p>
                          <p className="text-2xl font-black text-blue-600">R$ {Number(artist.price).toLocaleString('pt-BR')}</p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={handleSendProposal} 
                          disabled={isSubmitting} 
                          className="w-full bg-blue-600 h-14 rounded-2xl font-black text-lg shadow-xl shadow-blue-100"
                        >
                          {isSubmitting ? <Loader2 className="animate-spin" /> : "Enviar Proposta Real"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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