"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send, Zap, Trash2, MoreHorizontal } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from "@/utils/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Feed = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [postContent, setPostContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

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

      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`*, profiles:author_id (full_name, avatar_url)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(postsData || []);
    } catch (error: any) {
      showError("Erro ao carregar o feed.");
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!postContent.trim() || !userProfile) return;
    setIsPosting(true);
    try {
      const { error: postError } = await supabase.from('posts').insert({
        author_id: userProfile.id,
        content: postContent
      });
      if (postError) throw postError;

      const { error: xpError } = await supabase
        .from('profiles')
        .update({ xp_total: (userProfile.xp_total || 0) + 5 })
        .eq('id', userProfile.id);
      
      if (xpError) throw xpError;

      showSuccess("Post publicado! +5 XP conquistados.");
      setPostContent("");
      fetchData();
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
      showSuccess("Post removido.");
      setPosts(posts.filter(p => p.id !== postId));
    } catch (error: any) {
      showError("Erro ao excluir post.");
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <Card className="p-6 border-none shadow-sm bg-white rounded-2xl">
        <div className="flex gap-4">
          <Avatar><AvatarImage src={userProfile?.avatar_url} /></Avatar>
          <div className="flex-1 space-y-4">
            <Textarea 
              placeholder="O que há de novo no seu show?" 
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="border-none bg-slate-50 rounded-xl focus-visible:ring-indigo-500 min-h-[100px]"
            />
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1 text-amber-600 text-xs font-bold">
                <Zap className="w-3 h-3" /> Ganhe 5 XP ao postar
              </div>
              <Button onClick={handlePost} disabled={isPosting || !postContent.trim()} className="bg-indigo-600 rounded-xl px-6">
                {isPosting ? <Loader2 className="animate-spin" /> : "Publicar"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {posts.map((post) => (
        <Card key={post.id} className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar><AvatarImage src={post.profiles?.avatar_url} /></Avatar>
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
                  <DropdownMenuItem 
                    className="text-red-600 gap-2" 
                    onClick={() => handleDelete(post.id)}
                  >
                    <Trash2 className="w-4 h-4" /> Excluir Post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <div className="px-4 pb-4">
            <p className="text-slate-700 text-sm whitespace-pre-wrap">{post.content}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default Feed;