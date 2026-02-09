"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Star, MapPin, Edit3, Camera, Save, X, Loader2, Plus, Trash2, Upload
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { getSafeImageUrl } from '@/utils/url-validator';

const CATEGORIES = ["DJ", "Banda", "Cantor Solo", "Dupla Sertaneja", "Músico Instrumental", "Outros"];

const ProProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autorizado.");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-avatar-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);

      setFormData({ ...formData, avatar_url: publicUrl });
      setProfile({ ...profile, avatar_url: publicUrl });
      showSuccess("Foto de perfil atualizada!");
    } catch (error: any) {
      showError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handlePortfolioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-portfolio-${Date.now()}.${fileExt}`;
      const filePath = `portfolio/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('portfolio').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('portfolio').getPublicUrl(filePath);

      const updatedUrls = [...(profile.portfolio_urls || []), publicUrl];
      await supabase.from('profiles').update({ portfolio_urls: updatedUrls }).eq('id', profile.id);
      
      setProfile({ ...profile, portfolio_urls: updatedUrls });
      showSuccess("Imagem adicionada ao portfólio!");
    } catch (error: any) {
      showError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: formData.full_name,
        bio: formData.bio,
        category: formData.category,
        location: formData.location,
        price: formData.price
      }).eq('id', profile.id);

      if (error) throw error;
      
      setProfile(formData);
      setIsEditing(false);
      showSuccess("Perfil atualizado!");
    } catch (error: any) {
      showError(error.message);
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

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-indigo-600 w-10 h-10" /></div>;

  const safeAvatar = getSafeImageUrl(formData.avatar_url, `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.full_name}`);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <Card className="p-8 border-none shadow-2xl bg-white rounded-[2.5rem]">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          <div className="relative shrink-0 group">
            <div className="w-40 h-40 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-100 relative">
              {uploading && <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10"><Loader2 className="animate-spin text-white" /></div>}
              <img src={safeAvatar} className="w-full h-full object-cover" alt="Avatar" />
              <button 
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold gap-2"
              >
                <Camera className="w-6 h-6" />
                Alterar Foto
              </button>
            </div>
            <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
          </div>

          <div className="flex-1 space-y-6 w-full">
            <div className="flex justify-between items-start">
              <div className="space-y-2 w-full">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Nome Artístico</Label>
                        <Input value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="bg-slate-50 border-none h-12 rounded-xl" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Categoria</Label>
                        <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                          <SelectTrigger className="bg-slate-50 border-none h-12 rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Localização</Label>
                        <Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="bg-slate-50 border-none h-12 rounded-xl" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Cachê Base (R$)</Label>
                        <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="bg-slate-50 border-none h-12 rounded-xl" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-4xl font-black text-slate-900">{profile.full_name}</h1>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-indigo-50 text-indigo-600 border-none px-3 py-1 font-bold">{profile.category || "Sem Categoria"}</Badge>
                      <Badge variant="outline" className="flex items-center gap-1 border-slate-200 text-slate-500"><MapPin className="w-3 h-3" /> {profile.location || "Local não definido"}</Badge>
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button onClick={() => setIsEditing(false)} variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 rounded-xl"><X /></Button>
                    <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-100"><Save className="w-4 h-4 mr-2" /> Salvar</Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="rounded-xl border-slate-200"><Edit3 className="w-4 h-4 mr-2" /> Editar Perfil</Button>
                )}
              </div>
            </div>
            
            {isEditing ? (
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Biografia Profissional</Label>
                <Textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="min-h-[120px] bg-slate-50 border-none rounded-2xl" />
              </div>
            ) : (
              <p className="text-slate-600 leading-relaxed font-medium">{profile.bio || "Nenhuma biografia adicionada."}</p>
            )}
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-black text-slate-900">Portfólio</h3>
          <Button onClick={() => portfolioInputRef.current?.click()} disabled={uploading} className="bg-indigo-600 rounded-xl gap-2">
            {uploading ? <Loader2 className="animate-spin w-4 h-4" /> : <Upload className="w-4 h-4" />}
            Upload de Foto
          </Button>
          <input type="file" ref={portfolioInputRef} className="hidden" accept="image/*" onChange={handlePortfolioUpload} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {profile.portfolio_urls?.map((url: string, index: number) => (
            <div key={index} className="group relative aspect-square bg-slate-100 rounded-3xl overflow-hidden shadow-sm border border-slate-100">
              <img src={url} alt="Portfólio" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button variant="destructive" size="icon" onClick={() => removePortfolioImage(url)} className="rounded-full">
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