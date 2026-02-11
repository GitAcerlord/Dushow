"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, MessageSquare, Share2, MoreHorizontal, Edit2, Trash2, 
  Star, Crown, ExternalLink
} from "lucide-react";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { supabase } from '@/integrations/supabase/client';
import { getSafeImageUrl } from '@/utils/url-validator';
import CommentSection from './CommentSection';
import { cn } from '@/lib/utils';
import { showSuccess } from '@/utils/toast';

interface PostCardProps {
  post: any;
  currentUserId: string;
  onDelete: (id: string) => void;
  onEdit: (post: any) => void;
}

const PostCard = ({ post, currentUserId, onDelete, onEdit }: PostCardProps) => {
  const navigate = useNavigate();
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);

  useEffect(() => {
    fetchEngagement();
  }, [post.id]);

  const fetchEngagement = async () => {
    const { count: lCount } = await supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id);
    const { data: myLike } = await supabase.from('post_likes').select('id').eq('post_id', post.id).eq('user_id', currentUserId).maybeSingle();
    const { count: cCount } = await supabase.from('post_comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id);

    setLikesCount(lCount || 0);
    setIsLiked(!!myLike);
    setCommentsCount(cCount || 0);
  };

  const toggleLike = async () => {
    if (!currentUserId) return navigate('/login');
    if (isLiked) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', currentUserId);
      setLikesCount(prev => prev - 1);
      setIsLiked(false);
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUserId });
      setLikesCount(prev => prev + 1);
      setIsLiked(true);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/artist/${post.author_id}`;
    navigator.clipboard.writeText(url);
    showSuccess("Link do perfil copiado!");
  };

  const handleViewProfile = () => {
    navigate(`/app/artist/${post.author_id}`);
  };

  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2rem] hover:shadow-md transition-all">
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={handleViewProfile}>
          <Avatar className="w-10 h-10 border-2 border-slate-50 group-hover:border-[#2D1B69] transition-colors">
            <AvatarImage src={getSafeImageUrl(post.profiles?.avatar_url, '')} />
            <AvatarFallback>{post.profiles?.full_name?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-black text-sm text-[#2D1B69] group-hover:text-[#FFB703] transition-colors">{post.profiles?.full_name}</h4>
              {post.profiles?.is_superstar && <Crown className="w-3 h-3 text-[#FFB703]" />}
              {post.profiles?.is_verified && <Star className="w-3 h-3 text-blue-500 fill-current" />}
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {new Date(post.created_at).toLocaleDateString()} • {post.profiles?.category || 'Artista'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-[#2D1B69]" onClick={handleViewProfile}>
            <ExternalLink className="w-4 h-4" />
          </Button>
          {currentUserId === post.author_id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-400"><MoreHorizontal className="w-4 h-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem onClick={() => onEdit(post)} className="gap-2 cursor-pointer"><Edit2 className="w-4 h-4" /> Editar</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-red-600 gap-2 cursor-pointer"><Trash2 className="w-4 h-4" /> Excluir</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="px-5 pb-4 space-y-4">
        <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        
        {post.image_url && (
          <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-inner">
            <img src={getSafeImageUrl(post.image_url, '')} alt="Post" className="w-full h-auto max-h-[500px] object-cover" />
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
          <div className="flex gap-6">
            <button 
              onClick={toggleLike}
              className={cn(
                "flex items-center gap-1.5 text-xs font-bold transition-colors",
                isLiked ? "text-red-500" : "text-slate-400 hover:text-red-500"
              )}
            >
              <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
              {likesCount}
            </button>
            <button 
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#2D1B69] transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              {commentsCount}
            </button>
          </div>
          <button onClick={handleShare} className="text-slate-400 hover:text-[#2D1B69] transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {showComments && <CommentSection postId={post.id} currentUserId={currentUserId} />}
      </div>
    </Card>
  );
};

export default PostCard;