"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, MessageCircle, Trash2, Loader2, Camera, Send
} from "lucide-react";
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from "@/utils/toast";

const Feed = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [postContent, setPostContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setUserProfile(profile);
      }

      // Query simplificada para evitar erros de join complexos inicialmente
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id (
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(postsData || []);
    } catch (error: any) {
      console.error("Erro no Feed:", error);
      showError("Não foi possível carregar os posts.");
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!postContent.trim() || !userProfile) return;
    setIsPosting(true);
    try {
      let imageUrl = null;
      if (selectedImage) {
        const fileName = `${Date.now()}-${selectedImage.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, selectedImage);
        
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      const { error } = await supabase.from('posts').insert({
        author_id: userProfile.id,
        content: postContent,
        image_url: imageUrl
      });

      if (error) throw error;
      showSuccess("Post publicado!");
      setPostContent("");
      setSelectedImage(null);
      fetchData();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsPosting(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Excluir este post?")) return;
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      showSuccess("Post removido.");
      fetchData();
    } catch (error: any) {
      showError("Erro ao excluir post.");
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <Card className="p-6 border-none shadow-sm bg-white">
        <div className="flex gap-4">
          <Avatar><AvatarImage src={userProfile?.avatar_url} /></Avatar>
          <div className="flex-1 space-y-4">
            <Textarea 
              placeholder="O que há de novo no seu show?" 
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="border-none bg-slate-50 rounded-xl focus-visible:ring-indigo-500 min-h-[100px]"
            />
            {selectedImage && (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                <img src={URL.createObjectURL(selectedImage)} className="w-full h-full object-cover" />
                <button onClick={() => setSelectedImage(null)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg"><Trash2 className="w-3 h-3" /></button>
              </div>
            )}
            <div className="flex justify-between items-center">
              <label className="cursor-pointer p-2 hover:bg-slate-100 rounded-full transition-colors">
                <Camera className="w-5 h-5 text-slate-400" />
                <input type="file" className="hidden" accept="image/*" onChange={(e) => setSelectedImage(e.target.files?.[0] || null)} />
              </label>
              <Button onClick={handlePost} disabled={isPosting || !postContent.trim()} className="bg-indigo-600 rounded-xl px-6">
                {isPosting ? <Loader2 className="animate-spin" /> : "Publicar"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {posts.length === 0 ? (
        <div className="text-center py-12 text-slate-400">Nenhum post ainda. Seja o primeiro!</div>
      ) : (
        posts.map((post) => (
          <Card key={post.id} className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar><AvatarImage src={post.profiles?.avatar_url} /></Avatar>
                <div>
                  <h4 className="font-bold text-sm">{post.profiles?.full_name}</h4>
                  <p className="text-[10px] text-slate-400">{new Date(post.created_at).toLocaleString()}</p>
                </div>
              </div>
              {post.author_id === userProfile?.id && (
                <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)} className="text-slate-300 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="px-4 pb-4 space-y-4">
              <p className="text-slate-700 text-sm whitespace-pre-wrap">{post.content}</p>
              {post.image_url && <img src={post.image_url} className="w-full rounded-xl object-cover max-h-[500px]" alt="Post" />}
            </div>
            <div className="p-4 border-t flex gap-6">
              <button className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-red-500 transition-colors">
                <Heart className="w-5 h-5" /> Curtir
              </button>
              <button className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors">
                <MessageCircle className="w-5 h-5" /> Comentar
              </button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

export default Feed;