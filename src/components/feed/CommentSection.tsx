"use client";

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Trash2, Edit2, X, Check } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { getSafeImageUrl } from '@/utils/url-validator';
import { showError, showSuccess } from '@/utils/toast';

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
    setLoading(true);
    try {
      // 1. Busca apenas os comentários (sem join para evitar erro PGRST200)
      const { data: commentsData, error: commentsError } = await supabase
        .from('post_comments')
        .select('id, content, user_id, created_at')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      // 2. Extrai IDs únicos de usuários para buscar os perfis
      const userIds = Array.from(new Set(commentsData.map(c => c.user_id)));

      // 3. Busca os perfis dos autores
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // 4. Une os dados manualmente (Manual Join)
      const mergedComments = commentsData.map(comment => ({
        ...comment,
        profiles: profilesData?.find(p => p.id === comment.user_id) || { full_name: 'Usuário', avatar_url: null }
      }));

      setComments(mergedComments);
    } catch (e: any) {
      console.error("[CommentSection] Fetch error:", e);
      showError("Erro ao carregar comentários.");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      // 1. Insere o comentário
      const { data: insertedData, error: insertError } = await supabase
        .from('post_comments')
        .insert({ 
          post_id: postId, 
          user_id: currentUserId, 
          content: newComment 
        })
        .select('id, content, user_id, created_at')
        .single();

      if (insertError) throw insertError;

      // 2. Busca o perfil do usuário atual para a UI (evita novo join problemático)
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', currentUserId)
        .single();

      const newCommentWithProfile = {
        ...insertedData,
        profiles: myProfile || { full_name: 'Você', avatar_url: null }
      };
      
      setComments(prev => [...prev, newCommentWithProfile]);
      setNewComment("");
      showSuccess("Comentário enviado!");
    } catch (e: any) {
      console.error("[CommentSection] Post error:", e);
      showError("Erro ao enviar comentário.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('post_comments').delete().eq('id', id);
      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== id));
      showSuccess("Comentário excluído.");
    } catch (e) {
      showError("Erro ao excluir comentário.");
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editContent.trim()) return;
    try {
      const { error } = await supabase
        .from('post_comments')
        .update({ content: editContent, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      setComments(prev => prev.map(c => c.id === id ? { ...c, content: editContent } : c));
      setEditingId(null);
      showSuccess("Comentário atualizado!");
    } catch (e) {
      showError("Erro ao atualizar comentário.");
    }
  };

  if (loading) return <div className="py-4 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-indigo-600" /></div>;

  return (
    <div className="mt-4 space-y-4 border-t pt-4">
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-[10px] text-slate-400 text-center py-2">Nenhum comentário ainda. Seja o primeiro!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src={getSafeImageUrl(comment.profiles?.avatar_url, '')} />
                <AvatarFallback>{comment.profiles?.full_name?.[0] || '?'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">{comment.profiles?.full_name}</span>
                  {comment.user_id === currentUserId && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }} 
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => handleDelete(comment.id)} 
                        className="text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                
                {editingId === comment.id ? (
                  <div className="space-y-2">
                    <Input 
                      value={editContent} 
                      onChange={(e) => setEditContent(e.target.value)} 
                      className="h-8 text-xs bg-white border-indigo-200 focus-visible:ring-indigo-500" 
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdate(comment.id)} className="h-6 px-2 bg-indigo-600 text-[10px] gap-1">
                        <Check className="w-3 h-3" /> Salvar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-6 px-2 text-[10px] gap-1">
                        <X className="w-3 h-3" /> Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none">
                    <p className="text-xs text-slate-600 leading-relaxed">{comment.content}</p>
                  </div>
                )}
                <p className="text-[9px] text-slate-400 font-medium pl-1">
                  {new Date(comment.created_at).toLocaleDateString()} às {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Input 
          placeholder="Escreva um comentário..." 
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="h-10 text-xs bg-slate-50 border-none rounded-xl focus-visible:ring-indigo-500"
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <Button 
          size="sm" 
          onClick={handleSend} 
          disabled={submitting || !newComment.trim()} 
          className="bg-indigo-600 rounded-xl h-10 w-10 p-0 shrink-0 shadow-lg shadow-indigo-100"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};

export default CommentSection;