"use client";

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Trash2, Edit2, X } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { getSafeImageUrl } from '@/utils/url-validator';
import { showError } from '@/utils/toast';

interface CommentSectionProps {
  postId: string;
  currentUserId: string;
}

const CommentSection = ({ postId, currentUserId }: CommentSectionProps) => {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('post_comments')
      .select('*, profiles:user_id(full_name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (!error) setComments(data || []);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({ post_id: postId, user_id: currentUserId, content: newComment })
        .select('*, profiles:user_id(full_name, avatar_url)')
        .single();

      if (error) throw error;
      setComments([...comments, data]);
      setNewComment("");
    } catch (e) {
      showError("Erro ao comentar. Verifique sua conexão.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('post_comments').delete().eq('id', id);
    if (!error) setComments(comments.filter(c => c.id !== id));
  };

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from('post_comments')
      .update({ content: editContent, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setComments(comments.map(c => c.id === id ? { ...c, content: editContent } : c));
      setEditingId(null);
    }
  };

  if (loading) return <div className="py-4 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-slate-300" /></div>;

  return (
    <div className="mt-4 space-y-4 border-t pt-4">
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 group">
            <Avatar className="w-7 h-7">
              <AvatarImage src={getSafeImageUrl(comment.profiles?.avatar_url, '')} />
              <AvatarFallback>{comment.profiles?.full_name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 bg-slate-50 p-3 rounded-2xl relative">
              <div className="flex justify-between items-start">
                <span className="text-xs font-black text-slate-900">{comment.profiles?.full_name}</span>
                {comment.user_id === currentUserId && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }} className="text-slate-400 hover:text-indigo-600"><Edit2 className="w-3 h-3" /></button>
                    <button onClick={() => handleDelete(comment.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                  </div>
                )}
              </div>
              
              {editingId === comment.id ? (
                <div className="mt-2 flex gap-2">
                  <Input value={editContent} onChange={(e) => setEditContent(e.target.value)} className="h-7 text-xs" />
                  <Button size="sm" onClick={() => handleUpdate(comment.id)} className="h-7 px-2 bg-indigo-600"><Send className="w-3 h-3" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 px-2"><X className="w-3 h-3" /></Button>
                </div>
              ) : (
                <p className="text-xs text-slate-600 mt-1">{comment.content}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input 
          placeholder="Escreva um comentário..." 
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="h-9 text-xs bg-slate-50 border-none rounded-xl"
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <Button size="sm" onClick={handleSend} disabled={submitting} className="bg-indigo-600 rounded-xl h-9">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};

export default CommentSection;