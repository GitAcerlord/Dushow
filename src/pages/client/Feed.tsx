"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown, Rss } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showError } from "@/utils/toast";
import PostCard from '@/components/feed/PostCard';

const POSTS_PER_PAGE = 10;

const ClientFeed = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [currentUserId, setCurrentUserId] = useState("");

  const fetchData = useCallback(async (pageNumber = 0, append = false) => {
    if (pageNumber === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const from = pageNumber * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`*, profiles:author_id (id, full_name, avatar_url, category, rating, is_superstar, is_verified)`)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setHasMore(postsData.length === POSTS_PER_PAGE);
      setPosts(prev => append ? [...prev, ...postsData] : postsData);
    } catch (error: any) {
      showError("Erro ao carregar o feed social.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchData(0); }, [fetchData]);

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
          <Rss className="text-blue-600 w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900">Feed dos Artistas</h1>
          <p className="text-slate-500 text-sm">Descubra talentos através de seus trabalhos reais.</p>
        </div>
      </div>

      <div className="space-y-6">
        {posts.map((post) => (
          <PostCard 
            key={post.id} 
            post={post} 
            currentUserId={currentUserId} 
            onDelete={() => {}} // Contratante não deleta
            onEdit={() => {}}   // Contratante não edita
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={() => { setPage(p => p + 1); fetchData(page + 1, true); }} disabled={loadingMore} className="rounded-full px-8 gap-2 border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all">
            {loadingMore ? <Loader2 className="animate-spin w-4 h-4" /> : <><ChevronDown className="w-4 h-4" /> Carregar Mais</>}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ClientFeed;