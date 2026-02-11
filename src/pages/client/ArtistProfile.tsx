"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, MapPin, Music, CheckCircle2, Award, ArrowLeft, Loader2, Calendar, DollarSign, Heart, Lock
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { getSafeImageUrl } from '@/utils/url-validator';
import ReviewCard from '@/components/reviews/ReviewCard';
import { showSuccess, showError } from '@/utils/toast';
import ProposalModal from '@/components/contracts/ProposalModal';

const ArtistProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProposalOpen, setIsProposalOpen] = useState(false);

  useEffect(() => {
    fetchArtistData();
  }, [id]);

  const fetchArtistData = async () => {
    setLoading(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single();
      setArtist(profile);
      const { data: reviewsData } = await supabase.from('reviews').select('*, profiles:client_id(full_name, avatar_url), contracts:contract_id(event_name)').eq('pro_id', id);
      setReviews(reviewsData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#2D1B69] w-10 h-10" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-slate-500 font-bold">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-6 md:p-10 border-none shadow-2xl bg-white rounded-[3rem]">
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl bg-slate-100 shrink-0">
                <img src={getSafeImageUrl(artist.avatar_url, '')} className="w-full h-full object-cover" alt={artist.full_name} />
              </div>
              <div className="space-y-4 flex-1">
                <div className="flex flex-col md:flex-row items-center gap-3">
                  <h1 className="text-3xl md:text-4xl font-black text-[#2D1B69]">{artist.full_name}</h1>
                  {artist.is_superstar && <Badge className="bg-[#FFB703] text-[#2D1B69] border-none">SUPERSTAR</Badge>}
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm font-bold text-slate-500">
                  <span className="flex items-center gap-1 text-[#2D1B69]"><Music className="w-4 h-4" /> {artist.category}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {artist.location}</span>
                  <span className="flex items-center gap-1 text-[#FFB703]"><Star className="w-4 h-4 fill-current" /> {artist.rating}</span>
                </div>
                <p className="text-slate-600 leading-relaxed">{artist.bio}</p>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <h3 className="text-2xl font-black text-[#2D1B69]">Avaliações</h3>
            <div className="grid gap-4">
              {reviews.map((review) => (
                <ReviewCard key={review.id} {...review} clientName={review.profiles?.full_name} clientAvatar={review.profiles?.avatar_url} eventName={review.contracts?.event_name} />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar / Bottom Bar on Mobile */}
        <div className="space-y-6">
          <Card className="p-8 border-none shadow-xl bg-white rounded-[2.5rem] lg:sticky lg:top-24 space-y-6">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Cachê Base</p>
              <p className="text-4xl font-black text-[#2D1B69]">R$ {Number(artist.base_fee || 0).toLocaleString('pt-BR')}</p>
            </div>
            <Button 
              onClick={() => setIsProposalOpen(true)} 
              className="w-full h-14 bg-[#FFB703] hover:bg-[#e6a600] text-[#2D1B69] rounded-2xl font-black text-lg shadow-lg"
            >
              Solicitar Proposta
            </Button>
            <div className="pt-6 border-t space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Pagamento Seguro
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Contrato Digital
              </div>
            </div>
          </Card>
        </div>
      </div>

      <ProposalModal isOpen={isProposalOpen} onClose={() => setIsProposalOpen(false)} artist={artist} />
    </div>
  );
};

export default ArtistProfile;