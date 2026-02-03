"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Star, MessageSquare, TrendingUp, Award } from "lucide-react";
import ReviewCard from '@/components/reviews/ReviewCard';

const MOCK_REVIEWS = [
  {
    id: 1,
    clientName: "Clube Privilège",
    clientAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Privilege",
    rating: 5,
    comment: "O Alok superou todas as expectativas. Pista cheia do início ao fim e um profissionalismo impecável na montagem.",
    date: "15/05/2024",
    eventName: "Sunset Party"
  },
  {
    id: 2,
    clientName: "Ricardo Silva",
    clientAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ricardo",
    rating: 4,
    comment: "Excelente show! Apenas um pequeno atraso na passagem de som, mas a performance compensou tudo.",
    date: "02/05/2024",
    eventName: "Casamento VIP"
  },
  {
    id: 3,
    clientName: "Ana Souza",
    clientAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana",
    rating: 5,
    comment: "Incrível! Atencioso com os convidados e o repertório foi exatamente o que pedimos.",
    date: "20/04/2024",
    eventName: "Aniversário 15 anos"
  }
];

const ProReviews = () => {
  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Avaliações & Feedback</h1>
        <p className="text-slate-500 mt-1">O que seus contratantes estão dizendo sobre suas performances.</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="p-8 border-none shadow-sm bg-white flex flex-col items-center justify-center text-center">
          <p className="text-sm font-bold text-slate-400 uppercase mb-2">Nota Média</p>
          <h2 className="text-5xl font-black text-slate-900 mb-2">4.9</h2>
          <div className="flex mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
            ))}
          </div>
          <p className="text-xs text-slate-500">Baseado em 128 avaliações</p>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-white lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-900 mb-6">Distribuição de Notas</h3>
          <div className="space-y-4">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-500 w-4">{star}</span>
                <Star className="w-3 h-3 text-amber-400 fill-current" />
                <Progress value={star === 5 ? 85 : star === 4 ? 10 : 5} className="h-2 flex-1" />
                <span className="text-xs font-medium text-slate-400 w-8 text-right">
                  {star === 5 ? '85%' : star === 4 ? '10%' : '5%'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border-none shadow-sm bg-indigo-50 border border-indigo-100 flex gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h4 className="font-bold text-indigo-900 text-sm">Ponto Forte</h4>
            <p className="text-xs text-indigo-700 mt-1">"Energia da Pista" é o termo mais citado positivamente em suas avaliações.</p>
          </div>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-amber-50 border border-amber-100 flex gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <Award className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h4 className="font-bold text-amber-900 text-sm">Dica de Ouro</h4>
            <p className="text-xs text-amber-700 mt-1">Melhorar a pontualidade na passagem de som pode elevar sua nota para 5.0 absoluto.</p>
          </div>
        </Card>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Feedbacks Recentes</h3>
          <div className="flex gap-2">
            <button className="text-xs font-bold text-indigo-600 hover:underline">Mais Recentes</button>
            <span className="text-slate-300">|</span>
            <button className="text-xs font-bold text-slate-400 hover:text-indigo-600">Melhores Notas</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MOCK_REVIEWS.map((review) => (
            <ReviewCard key={review.id} {...review} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProReviews;