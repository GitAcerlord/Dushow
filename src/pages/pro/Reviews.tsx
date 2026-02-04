"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Star, Loader2, TrendingUp, Award } from "lucide-react";
import ReviewCard from '@/components/reviews/ReviewCard';
import { supabase } from '@/lib/supabase';

const ProReviews = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ avg: 0, count: 0 });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('reviews')
        .select('*, profiles:client_id(full_name, avatar_url), contracts:contract_id(event_name)')
        .eq('pro_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);

      if (data && data.length > 0) {
        const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
        setStats({ avg: Number((sum / data.length).toFixed(1)), count: data.length });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>;

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Avaliações Reais</h1>
        <p className="text-slate-500 mt-1">Feedback direto dos seus contratantes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="p-8 border-none shadow-sm bg-white flex flex-col items-center justify-center text-center">
          <p className="text-sm font-bold text-slate-400 uppercase mb-2">Nota Média</p>
          <h2 className="text-5xl font-black text-slate-900 mb-2">{stats.avg || '5.0'}</h2>
          <div className="flex mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-5 h-5 ${i < Math.round(stats.avg || 5) ? 'text-amber-400 fill-current' : 'text-slate-200'}`} />
            ))}
          </div>
          <p className="text-xs text-slate-500">Baseado em {stats.count} avaliações</p>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-white lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-900 mb-6">Distribuição de Notas</h3>
          <div className="space-y-4">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter(r => r.rating === star).length;
              const percent = stats.count > 0 ? (count / stats.count) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-500 w-4">{star}</span>
                  <Star className="w-3 h-3 text-amber-400 fill-current" />
                  <Progress value={percent} className="h-2 flex-1" />
                  <span className="text-xs font-medium text-slate-400 w-8 text-right">{Math.round(percent)}%</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
  );
};

export default ProReviews;