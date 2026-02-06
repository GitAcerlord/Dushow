"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, MapPin, Music, CheckCircle2, Award, ArrowLeft, Loader2, Calendar, DollarSign, Heart
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { getSafeImageUrl } from '@/utils/url-validator';
import ReviewCard from '@/components/reviews/ReviewCard';

const ArtistProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtistData();
  }, [id]);

  const fetchArtistData = async () => {
    setLoading(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single();
      setArtist(profile);

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, profiles:client_id(full_name, avatar_url), contracts:contract_id(event_name)')
        .eq('pro_id', id)
        .order('created_at', { ascending: false });
      
      setReviews(reviewsData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
  if (!artist) return <div className="p-20 text-center">Artista não encontrado.</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-10">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-slate-500 font-bold">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <Card className="p-8 border-none shadow-2xl bg-white rounded-[3rem]">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl bg-slate-100 shrink-0">
                <img src={getSafeImageUrl(artist.avatar_url, '')} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-4 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-4xl font-black text-slate-900">{artist.full_name}</h1>
                  {artist.is_superstar && <Badge className="bg-amber-500"><Award className="w-3 h-3 mr-1" /> Superstar</Badge>}
                  {artist.is_verified && <Badge className="bg-blue-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Verificado</Badge>}
                </div>
                <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-500">
                  <span className="flex items-center gap-1 text-blue-600"><Music className="w-4 h-4" /> {artist.category}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {artist.location}</span>
                  <span className="flex items-center gap-1 text-amber-500"><Star className="w-4 h-4 fill-current" /> {artist.rating} ({artist.reviews_count} avaliações)</span>
                </div>
                <p className="text-slate-600 leading-relaxed">{artist.bio || "Este artista ainda não adicionou uma biografia."}</p>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <h3 className="text-2xl font-black text-slate-900">Portfólio</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {artist.portfolio_urls?.map((url: string, i: number) => (
                <div key={i} className="aspect-square rounded-[2rem] overflow-hidden shadow-sm border border-slate-100">
                  <img src={getSafeImageUrl(url, '')} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-black text-slate-900">Avaliações</h3>
            <div className="grid gap-4">
              {reviews.map((review) => (
                <ReviewCard 
                  key={review.id}
                  clientName={review.profiles?.full_name}
                  clientAvatar={review.profiles?.avatar_url}
                  rating={review.rating}
                  comment={review.comment}
                  date={new Date(review.created_at).toLocaleDateString()}
                  eventName={review.contracts?.event_name}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="p-8 border-none shadow-xl bg-white rounded-[2.5rem] sticky top-24 space-y-6">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Cachê Base</p>
              <p className="text-4xl font-black text-blue-600">R$ {Number(artist.price).toLocaleString('pt-BR')}</p>
            </div>
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/client/discovery')} 
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black text-lg shadow-lg shadow-blue-100"
              >
                Solicitar Proposta
              </Button>
              <Button variant="outline" className="w-full h-12 rounded-2xl font-bold gap-2 border-slate-200">
                <Heart className="w-4 h-4" /> Salvar nos Favoritos
              </Button>
            </div>
            <div className="pt-6 border-t space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Pagamento via Escrow Seguro
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Contrato Digital Auditável
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ArtistProfile;