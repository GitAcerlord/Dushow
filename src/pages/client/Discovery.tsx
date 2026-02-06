"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Star, MapPin, Heart, Loader2, Crown, Calendar, DollarSign
} from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

const Discovery = () => {
  const navigate = useNavigate();
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [proposalData, setProposalData] = useState({
    eventName: "",
    eventDate: "",
    location: ""
  });

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').eq('role', 'PRO').order('is_superstar', { ascending: false });
    setArtists(data || []);
    setLoading(false);
  };

  const handleSendProposal = async () => {
    if (!proposalData.eventName || !proposalData.eventDate) {
      showError("Preencha os dados do evento.");
      return;
    }

    setIsSubmitting(true);
    try {
      // SECURITY FIX: Use Edge Function to create contract with server-side price validation
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

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-900">Descobrir Talentos</h1>
        <Input 
          className="max-w-xs bg-white rounded-xl" 
          placeholder="Buscar artista..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {artists.map((artist) => (
          <Card key={artist.id} className="group overflow-hidden border-none shadow-md bg-white rounded-3xl">
            <div className="h-48 bg-slate-100 relative">
              <img src={artist.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${artist.full_name}`} className="w-full h-full object-cover" />
              {artist.is_superstar && <Badge className="absolute top-3 right-3 bg-amber-500"><Crown className="w-3 h-3 mr-1" /> Superstar</Badge>}
            </div>
            <div className="p-5 space-y-4">
              <h3 className="font-bold text-slate-900">{artist.full_name}</h3>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black">Cachê</p>
                  <p className="text-lg font-black text-indigo-600">R$ {Number(artist.price).toLocaleString('pt-BR')}</p>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button onClick={() => setSelectedArtist(artist)} className="bg-slate-900 rounded-xl">Contratar</Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-3xl">
                    <DialogHeader>
                      <DialogTitle>Enviar Proposta para {artist.full_name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Nome do Evento</Label>
                        <Input value={proposalData.eventName} onChange={(e) => setProposalData({...proposalData, eventName: e.target.value})} placeholder="Ex: Casamento de Ana & Leo" />
                      </div>
                      <div className="space-y-2">
                        <Label>Data do Evento</Label>
                        <Input type="datetime-local" value={proposalData.eventDate} onChange={(e) => setProposalData({...proposalData, eventDate: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Localização</Label>
                        <Input value={proposalData.location} onChange={(e) => setProposalData({...proposalData, location: e.target.value})} placeholder="Cidade, Estado" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleSendProposal} disabled={isSubmitting} className="w-full bg-indigo-600 h-12 rounded-xl font-bold">
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
    </div>
  );
};

export default Discovery;