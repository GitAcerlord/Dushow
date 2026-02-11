"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Zap, Image as ImageIcon, X, ChevronDown } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from "@/utils/toast";
import { getSafeImageUrl } from '@/utils/url-validator';
import PostCard from '@/components/feed/PostCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const POSTS_PER_PAGE = 10;

const Feed = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [postContent, setPostContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para Edição
  const [editingPost, setEditingPost] = useState<any>(null);
  const [editContent, setEditContent] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchData = useCallback(async (pageNumber = 0, append = false) => {
    if (pageNumber === 0) setLoading(true);
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
        .select(`*, profiles:author_id (id, full_name, avatar_url, is_superstar, is_verified, category)`)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setPosts(prev => append ? [...prev, ...postsData] : postsData);
    } catch (error: any) {
      showError("Erro ao carregar o feed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(0); }, [fetchData]);

  const handlePost = async () => {
    if (!postContent.trim() || !userProfile || isPosting) return;
    setIsPosting(true);

    try {
      let imageUrl = null;
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${userProfile.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('posts').upload(fileName, selectedImage);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      const { error: postError } = await supabase.from('posts').insert({
        author_id: userProfile.id,
        content: postContent,
        image_url: imageUrl
      });
      if (postError) throw postError;

      showSuccess("Publicado com sucesso!");
      setPostContent(""); setSelectedImage(null); setImagePreview(null);
      fetchData(0);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Tem certeza que deseja excluir este post?")) return;
    
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      setPosts(prev => prev.filter(p => p.id !== postId));
      showSuccess("Post removido.");
    } catch (error: any) {
      showError("Erro ao excluir post.");
    }
  };

  const handleOpenEdit = (post: any) => {
    setEditingPost(post);
    setEditContent(post.content);
  };

  const handleUpdatePost = async () => {
    if (!editContent.trim() || isUpdating) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('posts')
        .update({ content: editContent, updated_at: new Date().toISOString() })
        .eq('id', editingPost.id);

      if (error) throw error;
      
      setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, content: editContent } : p));
      showSuccess("Post atualizado!");
      setEditingPost(null);
    } catch (error: any) {
      showError("Erro ao atualizar post.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-[#2D1B69] w-10 h-10" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <Card className="p-6 border-none shadow-sm bg-white rounded-[2rem]">
        <div className="flex gap-4">
          <Avatar><AvatarImage src={getSafeImageUrl(userProfile?.avatar_url, '')} /></Avatar>
          <div className="flex-1 space-y-4">
            <Textarea 
              placeholder="O que há de novo no seu show?" 
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="border-none bg-slate-50 rounded-2xl focus-visible:ring-[#2D1B69] min-h-[100px]"
            />
            
            {imagePreview && (
              <div className="relative rounded-2xl overflow-hidden border border-slate-100">
                <img src={imagePreview} className="w-full h-48 object-cover" alt="Preview" />
                <button onClick={() => {setSelectedImage(null); setImagePreview(null);}} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"><X className="w-4 h-4" /></button>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <div className="flex gap-2">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) { setSelectedImage(file); setImagePreview(URL.createObjectURL(file)); }
                }} />
                <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="text-slate-500 gap-2 hover:bg-indigo-50 hover:text-[#2D1B69] rounded-xl">
                  <ImageIcon className="w-4 h-4" /> Foto
                </Button>
                <div className="flex items-center gap-1 text-amber-600 text-xs font-black px-3"><Zap className="w-3 h-3" /> +5 XP</div>
              </div>
              <Button onClick={handlePost} disabled={isPosting || !postContent.trim()} className="bg-[#2D1B69] rounded-xl px-8 font-bold shadow-lg shadow-purple-100">
                {isPosting ? <Loader2 className="animate-spin" /> : "Publicar"}
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
            onDelete={handleDeletePost} 
            onEdit={handleOpenEdit} 
          />
        ))}
      </div>

      {/* Modal de Edição */}
      <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
        <DialogContent className="rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#2D1B69]">Editar Publicação</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[150px] bg-slate-50 border-none rounded-2xl focus-visible:ring-[#2D1B69]"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingPost(null)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleUpdatePost} disabled={isUpdating} className="bg-[#2D1B69] rounded-xl px-8 font-bold">
              {isUpdating ? <Loader2 className="animate-spin" /> : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Feed;