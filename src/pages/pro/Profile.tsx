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
  Star, MapPin, Edit3, Camera, Save, X, Loader2, Plus, Trash2, Upload, Wallet
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

  const handleSave = async () => {
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: formData.full_name,
        bio: formData.bio,
        category: formData.category,
        location: formData.location,
        price: formData.price,
        asaas_wallet_id: formData.asaas_wallet_id // Novo campo
      }).eq('id', profile.id);

      if (error) throw error;
      
      setProfile(formData);
      setIsEditing(false);
      showSuccess("Perfil atualizado!");
    } catch (error: any) {
      showError(error.message);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      if (updateError) throw updateError;

      setFormData({ ...formData, avatar_url: publicUrl });
      setProfile({ ...profile, avatar_url: publicUrl });
      showSuccess("Foto de perfil atualizada!");
    } catch (error: any) {
      showError(error.message || "Erro ao fazer upload da imagem.");
    } finally {
      setUploading(false);
    }
  };

  const handlePortfolioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}-${i}.${fileExt}`;
        const filePath = `portfolio/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('portfolio').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('portfolio').getPublicUrl(filePath);
        uploadedUrls.push(publicUrl);
      }

      const newPortfolio = [...(formData.portfolio_urls || []), ...uploadedUrls];
      const { error: updateError } = await supabase.from('profiles').update({ portfolio_urls: newPortfolio }).eq('id', profile.id);
      if (updateError) throw updateError;

      setFormData({ ...formData, portfolio_urls: newPortfolio });
      setProfile({ ...profile, portfolio_urls: newPortfolio });
      showSuccess("Imagens de portfólio adicionadas!");
    } catch (error: any) {
      console.error(error);
      showError(error.message || "Erro ao fazer upload do portfólio.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-indigo-600 w-10 h-10" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <Card className="p-8 border-none shadow-2xl bg-white rounded-[2.5rem]">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          <div className="relative shrink-0 group">
            <div className="w-40 h-40 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-100 relative">
              <img src={getSafeImageUrl(formData.avatar_url, '')} className="w-full h-full object-cover" alt="Avatar" />
              <button onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold gap-2">
                <Camera className="w-6 h-6" /> Alterar Foto
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
                        <Label className="text-[10px] font-black uppercase text-slate-400">Wallet ID Asaas (Para Receber)</Label>
                        <Input value={formData.asaas_wallet_id} onChange={(e) => setFormData({...formData, asaas_wallet_id: e.target.value})} placeholder="Ex: 00000000-0000-0000-0000-000000000000" className="bg-blue-50 border-none h-12 rounded-xl font-mono text-xs" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-4xl font-black text-slate-900">{profile.full_name}</h1>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-indigo-50 text-indigo-600 border-none px-3 py-1 font-bold">{profile.category || "Sem Categoria"}</Badge>
                      {profile.asaas_wallet_id ? (
                        <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-1 font-bold flex items-center gap-1"><Wallet className="w-3 h-3" /> Wallet Configurada</Badge>
                      ) : (
                        <Badge className="bg-red-50 text-red-600 border-none px-3 py-1 font-bold flex items-center gap-1"><X className="w-3 h-3" /> Wallet Pendente</Badge>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <Button onClick={handleSave} className="bg-indigo-600 rounded-xl shadow-lg"><Save className="w-4 h-4 mr-2" /> Salvar</Button>
                ) : (
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="rounded-xl"><Edit3 className="w-4 h-4 mr-2" /> Editar Perfil</Button>
                )}
              </div>
            </div>
            <p className="text-slate-600 leading-relaxed font-medium">{profile.bio || "Nenhuma biografia adicionada."}</p>

            <div className="mt-4">
              <h4 className="text-sm font-black text-slate-700 mb-3">Portfólio</h4>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {(formData.portfolio_urls || []).map((url: string, i: number) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-100">
                    <img src={getSafeImageUrl(url, '')} className="w-full h-full object-cover" />
                  </div>
                ))}
                {((formData.portfolio_urls || []).length === 0) && (
                  <div className="col-span-3 text-sm text-slate-400">Nenhuma imagem no portfólio ainda.</div>
                )}
              </div>

              {isEditing && (
                <div className="mt-4">
                  <Button variant="outline" onClick={() => portfolioInputRef.current?.click()} className="rounded-xl"><Upload className="w-4 h-4 mr-2" /> Adicionar Imagens</Button>
                  <input type="file" ref={portfolioInputRef} className="hidden" accept="image/*" multiple onChange={handlePortfolioUpload} />
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProProfile;