"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, CheckCircle2 } from "lucide-react";

interface ReviewProps {
  clientName: string;
  clientAvatar: string;
  rating: number;
  comment: string;
  date: string;
  eventName: string;
}

const ReviewCard = ({ clientName, clientAvatar, rating, comment, date, eventName }: ReviewProps) => {
  return (
    <Card className="p-6 border-none shadow-sm bg-white hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={clientAvatar} />
            <AvatarFallback>{clientName[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">{clientName}</h4>
            <p className="text-[10px] text-slate-400 font-medium">{date} • {eventName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full text-[10px] font-bold border border-emerald-100">
          <CheckCircle2 className="w-3 h-3" />
          Contratação Verificada
        </div>
      </div>

      <div className="flex mb-3">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-4 h-4 ${i < rating ? 'text-amber-400 fill-current' : 'text-slate-200'}`} 
          />
        ))}
      </div>

      <p className="text-sm text-slate-600 leading-relaxed italic">
        "{comment}"
      </p>
    </Card>
  );
};

export default ReviewCard;