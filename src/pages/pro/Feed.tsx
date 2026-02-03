"use client";

import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Image as ImageIcon, 
  Send, 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal,
  Trophy,
  Music2
} from "lucide-react";
import { showSuccess } from "@/utils/toast";

const MOCK_POSTS = [
  {
    id: 1,
    author: "DJ Alok",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alok",
    content: "Que energia incrível ontem no Sunset Festival! Obrigado a todos que compareceram. 🎧🔥 #Dushow #LiveMusic",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80",
    likes: 124,
    comments: 18,
    time: "2h atrás",
    points: 50
  },
  {
    id: 2,
    author: "Banda Jazz In",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jazz",
    content: "Preparativos para o show corporativo de hoje à noite. O repertório está refinado! 🎷✨",
    image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80",
    likes: 85,
    comments: 12,
    time: "5h atrás",
    points: 30
  }
];

const Feed = () => {
  const [postContent, setPostContent] = useState("");

  const handlePost = () => {
    if (!postContent.trim()) return;
    showSuccess("Post publicado! Você ganhou +10 pontos de engajamento.");
    setPostContent("");
  };

  return (
    <div className="p-8 max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Feed */}
      <div className="lg:col-span-2 space-y-6">
        {/* Create Post */}
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex gap-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alok" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <Textarea 
                placeholder="O que está acontecendo na sua carreira hoje?" 
                className="min-h-[100px] border-slate-100 bg-slate-50 focus-visible:ring-indigo-500 resize-none"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
              />
              <div className="flex justify-between items-center">
                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-indigo-600 gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Adicionar Foto
                </Button>
                <Button 
                  onClick={handlePost}
                  className="bg-indigo-600 hover:bg-indigo-700 px-6"
                  disabled={!postContent.trim()}
                >
                  Publicar
                  <Send className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Posts List */}
        {MOCK_POSTS.map((post) => (
          <Card key={post.id} className="border-none shadow-sm bg-white overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={post.avatar} />
                  <AvatarFallback>{post.author[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{post.author}</h4>
                  <p className="text-xs text-slate-500">{post.time}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-slate-400">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>

            <div className="px-4 pb-4">
              <p className="text-slate-700 text-sm leading-relaxed">
                {post.content}
              </p>
            </div>

            {post.image && (
              <div className="aspect-video w-full overflow-hidden bg-slate-100">
                <img src={post.image} alt="Post content" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="p-4 border-t flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button className="flex items-center gap-2 text-slate-500 hover:text-red-500 transition-colors group">
                  <Heart className="w-5 h-5 group-hover:fill-red-500" />
                  <span className="text-xs font-medium">{post.likes}</span>
                </button>
                <button className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-xs font-medium">{post.comments}</span>
                </button>
                <button className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-[10px] font-bold uppercase">
                <Trophy className="w-3 h-3" />
                +{post.points} pts
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Sidebar Info */}
      <div className="space-y-6">
        <Card className="p-6 border-none shadow-sm bg-indigo-600 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-6 h-6 text-amber-300" />
            <h3 className="font-bold">Ranking Semanal</h3>
          </div>
          <div className="space-y-4">
            {[
              { name: "DJ Alok", pts: "1.250", rank: 1 },
              { name: "Banda Jazz In", pts: "980", rank: 2 },
              { name: "Mariana Voz", pts: "850", rank: 3 },
            ].map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center bg-white/20 rounded text-[10px] font-bold">
                    {item.rank}
                  </span>
                  <span>{item.name}</span>
                </div>
                <span className="font-bold">{item.pts}</span>
              </div>
            ))}
          </div>
          <Button variant="secondary" className="w-full mt-6 bg-white text-indigo-600 hover:bg-indigo-50 text-xs font-bold">
            Ver Ranking Completo
          </Button>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-white">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Music2 className="w-5 h-5 text-indigo-600" />
            Dicas de Carreira
          </h3>
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs font-bold text-indigo-600 uppercase mb-1">Dica do Dia</p>
              <p className="text-xs text-slate-600">Postar fotos de alta qualidade dos seus shows aumenta em 40% suas chances de contratação.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Gamificação</p>
              <p className="text-xs text-slate-600">Responda aos comentários dos seus posts para ganhar pontos em dobro hoje!</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Feed;