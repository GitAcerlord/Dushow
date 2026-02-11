"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Zap, Image as ImageIcon, X, ChevronDown, Tag as TagIcon } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from "@/utils/toast";
import { getSafeImageUrl } from '@/utils/url-validator';
import PostCard from '@/components/feed/PostCard';
import { Label } from "@/components/ui/label";

const POSTS_PER_PAGE = 10;

const Feed = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState("");
  const [postTags, setPostTags] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchData = useCallback(async (pageNumber = 0, append = false) => {
    if (pageNumber === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && pageNumber === 0) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setUserProfile(profile);
      }

      const from = pageNumber * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id (
            id,
            full_name,
            avatar_url,
            is_superstar,
            is_verified,
            category
          )
        `)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setHasMore(postsData.length === POSTS_PER_PAGE);
      setPosts(prev => append ? [...prev, ...postsData] : postsData);
    } catch (error: any) {
      showError("Erro ao carregar o feed.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchData(0); }, [fetchData]);

  const handlePost = async () => {
    if (!postContent.trim() || !userProfile) return;
    setIsPosting(true);
    const tagsArray = postTags.split(',').map(t => t.trim()).filter(t => t !== "");

    try {
      if (editingPost) {
        const { error } = await supabase.from('posts').update({
          content: postContent,
          image_url: postImage,
          tags: tagsArray,
          updated_at: new Date().toISOString()
        }).eq('id', editingPost.id);
        if (error) throw error;
        showSuccess("Post atualizado!");
      } else {
        const { error } = await supabase.from('posts').insert({
          author_id: userProfile.id,
          content: postContent,
          image_url: postImage,
          tags: tagsArray
        });
        if (error) throw error;

        const { data: latestProfile, error: profileError } = await supabase
          .from('profiles')
          .select('xp_total')
          .eq('id', userProfile.id)
          .single();

        if (profileError) throw profileError;

        const updatedXp = (latestProfile?.xp_total || 0) + 5;
        const { error: xpError } = await supabase
          .from('profiles')
          .update({ xp_total: updatedXp })
          .eq('id', userProfile.id);

        if (xpError) throw xpError;

        setUserProfile((prev: any) => prev ? { ...prev, xp_total: updatedXp } : prev);
        showSuccess("Publicado! +5 XP.");
      }
      setPostContent(""); setPostImage(""); setPostTags(""); setEditingPost(null);
      fetchData(0);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsPosting(false);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      // Chamada para a Edge Function que tem permissão de service_role
      const { data, error } = await supabase.functions.invoke('delete-post', {
        body: { postId }
      });

      if (error) {
        const errorBody = await error.context?.json();
        throw new Error(errorBody?.error || error.message);
      }

      setPosts(prev => prev.filter(p => p.id !== postId));
      showSuccess("Post e engajamento removidos com sucesso.");
    } catch (error: any) {
      console.error("Delete Error:", error);
      showError(error.message || "Falha na exclusão segura do post.");
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <Card className="p-6 border-none shadow-sm bg-white rounded-[2rem]">
        <div className="flex gap-4">
          <Avatar><AvatarImage src={getSafeImageUrl(userProfile?.avatar_url, '')} /></Avatar>
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-sm">{editingPost ? "Editar Post" : "Nova Publicação"}</h3>
              {editingPost && <Button variant="ghost" size="icon" onClick={() => {setEditingPost(null); setPostContent(""); setPostImage(""); setPostTags("");}}><X className="w-4 h-4" /></Button>}
            </div>
            <Textarea 
              placeholder="O que há de novo no seu show?" 
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="border-none bg-slate-50 rounded-2xl focus-visible:ring-indigo-500 min-h-[100px]"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><ImageIcon className="w-3 h-3" /> URL da Imagem</Label>
                <Input placeholder="https://..." value={postImage} onChange={(e) => setPostImage(e.target.value)} className="bg-slate-50 border-none rounded-xl h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><TagIcon className="w-3 h-3" /> Tags</Label>
                <Input placeholder="show, dj" value={postTags} onChange={(e) => setPostTags(e.target.value)} className="bg-slate-50 border-none rounded-xl h-9 text-xs" />
              </div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center gap-1 text-amber-600 text-xs font-black"><Zap className="w-3 h-3" /> +5 XP</div>
              <Button onClick={handlePost} disabled={isPosting || !postContent.trim()} className="bg-indigo-600 rounded-xl px-8 font-bold">
                {isPosting ? <Loader2 className="animate-spin" /> : editingPost ? "Salvar" : "Publicar"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        {posts.map((post) => (
          <PostCard 
            key={post.id} 
            post={post} 
            currentUserId={userProfile?.id} 
            onDelete={handleDelete}
            onEdit={(p) => {
              setEditingPost(p);
              setPostContent(p.content);
              setPostImage(p.image_url || "");
              setPostTags(p.tags?.join(', ') || "");
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={() => { setPage(p => p + 1); fetchData(page + 1, true); }} disabled={loadingMore} className="rounded-full px-8 gap-2 border-slate-200 text-slate-500">
            {loadingMore ? <Loader2 className="animate-spin w-4 h-4" /> : <><ChevronDown className="w-4 h-4" /> Carregar Mais</>}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Feed;