"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send, Zap, Trash2, MoreHorizontal, Edit2, Image as ImageIcon, X, ChevronDown } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from "@/utils/toast";
import { isValidImageUrl, getSafeImageUrl } from '@/utils/url-validator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const POSTS_PER_PAGE = 10;

const Feed = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState("");
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
        .select(`*, profiles:author_id (full_name, avatar_url)`)
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
      showError("Erro ao carregar o feed.");
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

  const handlePost = async () => {
    if (!postContent.trim() || !userProfile) return;

    if (postImage && !isValidImageUrl(postImage)) {
      showError("URL de imagem não permitida.");
      return;
    }

    setIsPosting(true);
    try {
      if (editingPost) {
        const { error } = await supabase.from('posts').update({
          content: postContent,
          image_url: postImage
        }).eq('id', editingPost.id);
        if (error) throw error;
        showSuccess("Post atualizado!");
      } else {
        const { error: postError } = await supabase.from('posts').insert({
          author_id: userProfile.id,
          content: postContent,
          image_url: postImage
        });
        if (postError) throw postError;

        // Gamificação
        await supabase.from('profiles').update({ 
          xp_total: (userProfile.xp_total || 0) + 5 
        }).eq('id', userProfile.id);
        
        showSuccess("Post publicado! +5 XP.");
      }

      setPostContent("");
      setPostImage("");
      setEditingPost(null);
      setPage(0);
      fetchData(0);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsPosting(false);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      
      setPosts(prev => prev.filter(p => p.id !== postId));
      showSuccess("Post removido permanentemente.");
    } catch (error: any) {
      showError("Erro ao excluir post do banco de dados.");
    }
  };

  const startEdit = (post: any) => {
    setEditingPost(post);
    setPostContent(post.content);
    setPostImage(post.image_url || "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <Card className="p-6 border-none shadow-sm bg-white rounded-2xl">
        <div className="flex gap-4">
          <Avatar><AvatarImage src={getSafeImageUrl(userProfile?.avatar_url, '')} /></Avatar>
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm">{editingPost ? "Editar Post" : "Nova Publicação"}</h3>
              {editingPost && <Button variant="ghost" size="icon" onClick={() => {setEditingPost(null); setPostContent(""); setPostImage("");}}><X className="w-4 h-4" /></Button>}
            </div>
            <Textarea 
              placeholder="O que há de novo no seu show?" 
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="border-none bg-slate-50 rounded-xl focus-visible:ring-indigo-500 min-h-[100px]"
            />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ImageIcon className="w-3 h-3" /> URL da Imagem (opcional)
              </div>
              <Input 
                placeholder="https://..." 
                value={postImage} 
                onChange={(e) => setPostImage(e.target.value)}
                className="bg-slate-50 border-none rounded-xl h-8 text-xs"
              />
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1 text-amber-600 text-xs font-bold">
                <Zap className="w-3 h-3" /> +5 XP
              </div>
              <Button onClick={handlePost} disabled={isPosting || !postContent.trim()} className="bg-indigo-600 rounded-xl px-6">
                {isPosting ? <Loader2 className="animate-spin" /> : editingPost ? "Salvar" : "Publicar"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        {posts.map((post) => (
          <Card key={post.id} className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar><AvatarImage src={getSafeImageUrl(post.profiles?.avatar_url, '')} /></Avatar>
                <div>
                  <h4 className="font-bold text-sm">{post.profiles?.full_name}</h4>
                  <p className="text-[10px] text-slate-400">{new Date(post.created_at).toLocaleString()}</p>
                </div>
              </div>
              {userProfile?.id === post.author_id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => startEdit(post)} className="gap-2">
                      <Edit2 className="w-4 h-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600 gap-2" 
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="w-4 h-4" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <div className="px-4 pb-4 space-y-3">
              <p className="text-slate-700 text-sm whitespace-pre-wrap">{post.content}</p>
              {post.image_url && (
                <div className="rounded-xl overflow-hidden border border-slate-100">
                  <img src={getSafeImageUrl(post.image_url, '')} alt="Post" className="w-full h-auto max-h-96 object-cover" />
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
            className="rounded-full px-8 gap-2 border-slate-200 text-slate-500"
          >
            {loadingMore ? <Loader2 className="animate-spin w-4 h-4" /> : <><ChevronDown className="w-4 h-4" /> Carregar Mais</>}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Feed;