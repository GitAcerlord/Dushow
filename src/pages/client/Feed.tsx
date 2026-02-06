"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, ChevronDown, Star, Music } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showError } from "@/utils/toast";
import { getSafeImageUrl } from '@/utils/url-validator';

const POSTS_PER_PAGE = 10;

const ClientFeed = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchData = useCallback(async (pageNumber = 0, append = false) => {
    if (pageNumber === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const from = pageNumber * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`*, profiles:author_id (id, full_name, avatar_url, category, rating)`)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (postsData.length < POSTS_PER_PAGE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (append) {
        setPosts(prev => [...prev, ...postsData]);
      } else {
        setPosts(postsData || []);
      }
    } catch (error: any) {
      showError("Erro ao carregar o feed social.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchData(0);
  }, [fetchData]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchData(nextPage, true);
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900">Feed dos Artistas</h1>
        <p className="text-slate-500">Acompanhe as novidades e bastidores dos talentos da DUSHOW.</p>
      </div>

      <div className="space-y-6">
        {posts.map((post) => (
          <Card key={post.id} className="border-none shadow-sm bg-white overflow-hidden rounded-[2rem] hover:shadow-md transition-shadow">
            <div className="p-5 flex items-center justify-between border-b border-slate-50">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border-2 border-blue-50">
                  <AvatarImage src={getSafeImageUrl(post.profiles?.avatar_url, '')} />
                  <AvatarFallback>{post.profiles?.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">{post.profiles?.full_name}</h4>
                    {post.profiles?.rating && (
                      <div className="flex items-center gap-0.5 text-amber-500 text-[10px] font-bold">
                        <Star className="w-3 h-3 fill-current" /> {post.profiles.rating}
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Music className="w-3 h-3" /> {post.profiles?.category || 'Artista'} • {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-blue-600 font-bold text-xs rounded-xl">
                Ver Perfil
              </Button>
            </div>
            <div className="px-5 pb-5 pt-4 space-y-4">
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
              {post.image_url && (
                <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-inner">
                  <img 
                    src={getSafeImageUrl(post.image_url, '')} 
                    alt="Post" 
                    className="w-full h-auto max-h-[500px] object-cover" 
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button 
            variant="outline" 
            onClick={handleLoadMore} 
            disabled={loadingMore}
            className="rounded-full px-8 gap-2 border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all"
          >
            {loadingMore ? <Loader2 className="animate-spin w-4 h-4" /> : <><ChevronDown className="w-4 h-4" /> Carregar Mais</>}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ClientFeed;