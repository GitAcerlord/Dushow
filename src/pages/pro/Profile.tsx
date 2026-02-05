"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Star, MapPin, Music, Edit3, Camera, CheckCircle2, Award, Save, X, Loader2, Plus, Trash2
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

const CATEGORIES = ["DJ", "Banda", "Cantor Solo", "Dupla Sertaneja", "Músico Instrumental", "Outros"];

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
      const { error } = await supabase.from('profiles').update({
        full_name: formData.full_name,
        bio: formData.bio,
        category: formData.category,
        location: formData.location,
        price: formData.price,
        avatar_url: formData.avatar_url
      }).eq('id', profile.id);

      if (error) throw error;
      
      setProfile(formData);
      setIsEditing(false);
      showSuccess("Perfil atualizado com sucesso!");
    } catch (error: any) {
      showError(error.message);
    }
  };

  const addPortfolioImage = async () => {
    if (!newImageUrl.trim() || !newImageUrl.startsWith('http')) {
      showError("Insira uma URL de imagem válida.");
      return;
    }

    const updatedUrls = [...(profile.portfolio_urls || []), newImageUrl];
    try {
      const { error } = await supabase.from('profiles').update({ portfolio_urls: updatedUrls }).eq('id', profile.id);
      if (error) throw error;
      setProfile({ ...profile, portfolio_urls: updatedUrls });
      setNewImageUrl("");
      showSuccess("Imagem adicionada!");
    } catch (error: any) {
      showError("Erro ao salvar imagem.");
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

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <Card className="p-8 border-none shadow-2xl bg-white rounded-[2.5rem]">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          <div className="relative shrink-0">
            <div className="w-40 h-40 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-100">
              <img src={formData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.full_name}`} className="w-full h-full object-cover" />
            </div>
            {isEditing && (
              <div className="mt-4">
                <Label className="text-xs">URL do Avatar</Label>
                <Input 
                  value={formData.avatar_url || ""} 
                  onChange={(e) => setFormData({...formData, avatar_url: e.target.value})}
                  className="h-8 text-xs"
                />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-6 w-full">
            <div className="flex justify-between items-start">
              <div className="space-y-2 w-full">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Nome Completo</Label>
                        <Input value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label>Categoria</Label>
                        <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Localização (Cidade/UF)</Label>
                        <Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label>Cachê Base (R$)</Label>
                        <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-4xl font-black text-slate-900">{profile.full_name}</h1>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-indigo-50 text-indigo-600 border-none">{profile.category || "Sem Categoria"}</Badge>
                      <Badge variant="outline" className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {profile.location || "Local não definido"}</Badge>
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button onClick={() => setIsEditing(false)} variant="ghost" size="icon" className="rounded-xl text-red-500"><X /></Button>
                    <Button onClick={handleSave} className="bg-indigo-600 rounded-xl"><Save className="w-4 h-4 mr-2" /> Salvar</Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="rounded-xl"><Edit3 className="w-4 h-4 mr-2" /> Editar</Button>
                )}
              </div>
            </div>
            
            {isEditing ? (
              <div className="space-y-2">
                <Label>Biografia</Label>
                <Textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="min-h-[100px]" />
              </div>
            ) : (
              <p className="text-slate-600 leading-relaxed">{profile.bio || "Nenhuma biografia adicionada."}</p>
            )}
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900">Portfólio</h3>
        <div className="flex gap-2">
          <Input 
            placeholder="URL da imagem..." 
            value={newImageUrl} 
            onChange={(e) => setNewImageUrl(e.target.value)}
            className="bg-white border-slate-200 rounded-xl"
          />
          <Button onClick={addPortfolioImage} className="bg-indigo-600 rounded-xl shrink-0">
            <Plus className="w-4 h-4 mr-2" /> Adicionar
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {profile.portfolio_urls?.map((url: string, index: number) => (
            <div key={index} className="group relative aspect-square bg-slate-100 rounded-3xl overflow-hidden shadow-sm">
              <img src={url} alt="Portfólio" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button variant="destructive" size="icon" onClick={() => removePortfolioImage(url)}>
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProProfile;