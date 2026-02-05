"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Star, MapPin, Music, Edit3, Camera, CheckCircle2, Award, Save, X, Loader2, DollarSign, Briefcase, Image as ImageIcon, Crown, Plus, Trash2
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

const ProProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>({});
  const [newImageUrl, setNewImageUrl] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
      setFormData(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase.from('profiles').update(formData).eq('id', profile.id);
      if (error) throw error;
      setProfile(formData);
      setIsEditing(false);
      showSuccess("Perfil atualizado!");
    } catch (error: any) {
      showError(error.message);
    }
  };

  const addPortfolioImage = async () => {
    if (!newImageUrl.trim()) return;
    const updatedUrls = [...(profile.portfolio_urls || []), newImageUrl];
    try {
      const { error } = await supabase.from('profiles').update({ portfolio_urls: updatedUrls }).eq('id', profile.id);
      if (error) throw error;
      setProfile({ ...profile, portfolio_urls: updatedUrls });
      setNewImageUrl("");
      showSuccess("Imagem adicionada ao portfólio!");
    } catch (error: any) {
      showError("Erro ao adicionar imagem.");
    }
  };

  const removePortfolioImage = async (urlToRemove: string) => {
    const updatedUrls = profile.portfolio_urls.filter((url: string) => url !== urlToRemove);
    try {
      const { error } = await supabase.from('profiles').update({ portfolio_urls: updatedUrls }).eq('id', profile.id);
      if (error) throw error;
      setProfile({ ...profile, portfolio_urls: updatedUrls });
      showSuccess("Imagem removida.");
    } catch (error: any) {
      showError("Erro ao remover imagem.");
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>;
  if (!profile) return <div className="p-12 text-center">Perfil não encontrado.</div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <Card className="p-6 md:p-8 border-none shadow-2xl bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden relative">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-start text-center md:text-left">
          <div className="relative shrink-0">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-100">
              <img src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.full_name}`} className="w-full h-full object-cover" />
            </div>
            {profile.is_superstar && (
              <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white p-2 rounded-xl shadow-lg">
                <Crown className="w-5 h-5" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-6 w-full">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                  <h1 className="text-2xl md:text-4xl font-black text-slate-900">{profile.full_name}</h1>
                  {profile.is_verified && <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />}
                </div>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {profile.areas_of_activity?.map((area: string) => (
                    <Badge key={area} className="bg-indigo-50 text-indigo-600 border-none px-3 py-1 text-[10px] md:text-xs">{area}</Badge>
                  )) || <Badge variant="outline">Defina suas áreas</Badge>}
                </div>
              </div>
              <Button onClick={() => setIsEditing(!isEditing)} variant="outline" className="rounded-xl border-slate-200 w-full md:w-auto">
                {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
                {isEditing ? "Cancelar" : "Editar Perfil"}
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2 md:gap-4">
              <div className="bg-slate-50 p-3 md:p-4 rounded-2xl text-center">
                <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase">Trabalhos</p>
                <p className="text-sm md:text-xl font-black text-slate-900">{profile.work_count || 0}</p>
              </div>
              <div className="bg-slate-50 p-3 md:p-4 rounded-2xl text-center">
                <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase">Avaliação</p>
                <p className="text-sm md:text-xl font-black text-slate-900">{profile.rating || '5.0'}</p>
              </div>
              <div className="bg-slate-50 p-3 md:p-4 rounded-2xl text-center">
                <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase">Cachê Base</p>
                <p className="text-sm md:text-xl font-black text-indigo-600">R$ {Number(profile.price).toLocaleString('pt-BR')}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Sobre Mim</h4>
              <p className="text-sm md:text-base text-slate-600 leading-relaxed">{profile.bio || "Conte sua história aqui..."}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Portfólio CRUD */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="text-2xl font-black text-slate-900">Meu Portfólio</h3>
          <div className="flex gap-2 w-full md:w-auto">
            <Input 
              placeholder="URL da imagem..." 
              value={newImageUrl} 
              onChange={(e) => setNewImageUrl(e.target.value)}
              className="bg-white border-slate-200 rounded-xl h-10"
            />
            <Button onClick={addPortfolioImage} className="bg-indigo-600 rounded-xl h-10 px-4">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {profile.portfolio_urls?.map((url: string, index: number) => (
            <div key={index} className="group relative aspect-square bg-slate-100 rounded-3xl overflow-hidden shadow-sm">
              <img src={url} alt={`Portfólio ${index}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="rounded-full h-10 w-10"
                  onClick={() => removePortfolioImage(url)}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          ))}
          {(!profile.portfolio_urls || profile.portfolio_urls.length === 0) && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400">
              <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm font-medium">Nenhuma imagem no portfólio ainda.</p>
            </div>
          )}
        </div>
      </div>

      {isEditing && (
        <Card className="p-6 md:p-8 border-none shadow-2xl bg-white rounded-[2rem] space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Nome Artístico</Label>
              <Input value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="h-12 bg-slate-50 border-none rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Cachê Base (R$)</Label>
              <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="h-12 bg-slate-50 border-none rounded-xl" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Áreas de Atuação (separadas por vírgula)</Label>
              <Input 
                value={formData.areas_of_activity?.join(', ')} 
                onChange={(e) => setFormData({...formData, areas_of_activity: e.target.value.split(',').map((s: string) => s.trim())})} 
                className="h-12 bg-slate-50 border-none rounded-xl" 
                placeholder="Ex: Violão, Guitarra, Vocal"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Resumo / Biografia</Label>
              <Textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} rows={5} className="bg-slate-50 border-none rounded-xl" />
            </div>
          </div>
          <Button onClick={handleSave} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 font-black rounded-2xl shadow-xl shadow-indigo-100">
            <Save className="w-5 h-5 mr-2" /> Salvar Alterações
          </Button>
        </Card>
      )}
    </div>
  );
};

export default ProProfile;