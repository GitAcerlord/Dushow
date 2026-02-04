"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Image as ImageIcon, Send, Heart, MessageCircle, Share2, MoreHorizontal, Trophy, Music2, Video, Loader2
} from "lucide-react";
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from "@/utils/toast";

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
        .select('*, profiles:author_id(full_name, avatar_url)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(postsData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!postContent.trim() || !userProfile) return;
    setIsPosting(true);
    try {
      const { error } = await supabase.from('posts').insert({
        author_id: userProfile.id,
        content: postContent
      });

      if (error) throw error;

      showSuccess("Post publicado! Você ganhou +10 pontos.");
      setPostContent("");
      fetchData();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsPosting(false);
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>;

  return (
    <div className="p-8 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex gap-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={userProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.full_name}`} />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <Textarea 
                placeholder="O que está acontecendo na sua carreira hoje?" 
                className="min-h-[100px] border-slate-100 bg-slate-50 rounded-xl"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
              />
              <div className="flex justify-end">
                <Button onClick={handlePost} disabled={isPosting || !postContent.trim()} className="bg-indigo-600">
                  {isPosting ? <Loader2 className="animate-spin" /> : <><Send className="mr-2 w-4 h-4" /> Publicar</>}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {posts.map((post) => (
          <Card key={post.id} className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
            <div className="p-4 flex items-center gap-3">
              <Avatar>
                <AvatarImage src={post.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.profiles?.full_name}`} />
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{post.profiles?.full_name}</h4>
                <p className="text-[10px] text-slate-400">{new Date(post.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="px-4 pb-4">
              <p className="text-slate-700 text-sm leading-relaxed">{post.content}</p>
            </div>
            <div className="p-4 border-t flex items-center justify-between bg-slate-50/50">
              <button className="flex items-center gap-2 text-slate-500 hover:text-red-500 transition-colors">
                <Heart className="w-5 h-5" />
                <span className="text-xs font-bold">{post.likes_count}</span>
              </button>
              <div className="text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-[10px] font-black">+10 pts</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Feed;