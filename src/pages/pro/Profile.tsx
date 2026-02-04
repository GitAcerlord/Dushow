"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Star, MapPin, Music, Edit3, Camera, CheckCircle2, Award, Save, X, Loader2, DollarSign
} from "lucide-react";
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from '@/utils/toast';

const ProProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error) throw error;
      setProfile(data);
      setFormData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      showSuccess("Foto de perfil atualizada!");
    } catch (error: any) {
      showError("Erro ao subir foto.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase.from('profiles').update(formData).eq('id', profile.id);
      if (error) throw error;
      setProfile(formData);
      setIsEditing(false);
      showSuccess("Perfil salvo!");
    } catch (error: any) {
      showError(error.message);
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <Card className="p-8 border-none shadow-sm bg-white relative overflow-hidden rounded-3xl">
        <div className="relative flex flex-col md:flex-row gap-8 items-center">
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-slate-100">
              <img src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.full_name}`} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-3xl">
              {uploading ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white w-8 h-8" />}
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
            </label>
          </div>

          <div className="flex-1 space-y-4 text-center md:text-left">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <h1 className="text-3xl font-bold text-slate-900">{profile.full_name}</h1>
                {profile.is_verified && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                {profile.is_superstar && <Award className="w-5 h-5 text-amber-500" />}
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1"><Music className="w-4 h-4" /> {profile.category || 'Estilo Musical'}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {profile.location || 'Cidade'}</span>
                <span className="flex items-center gap-1 font-bold text-indigo-600"><DollarSign className="w-4 h-4" /> R$ {Number(profile.price).toLocaleString('pt-BR')}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl text-sm text-slate-600 leading-relaxed">
              <h4 className="font-bold text-slate-900 mb-1 uppercase text-[10px] tracking-wider">Biografia</h4>
              {profile.bio || "Nenhuma biografia adicionada ainda."}
            </div>
          </div>

          <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? "outline" : "default"} className="bg-indigo-600 rounded-xl">
            {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
            {isEditing ? "Cancelar" : "Editar Perfil"}
          </Button>
        </div>
      </Card>

      {isEditing && (
        <Card className="p-8 border-none shadow-sm bg-white space-y-6 rounded-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Nome Artístico</Label>
              <Input value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="bg-slate-50 border-none h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Cachê Base (R$)</Label>
              <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="bg-slate-50 border-none h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Categoria / Estilo</Label>
              <Input value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="bg-slate-50 border-none h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Localização</Label>
              <Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="bg-slate-50 border-none h-12 rounded-xl" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Biografia</Label>
              <Textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} rows={4} className="bg-slate-50 border-none rounded-xl" />
            </div>
          </div>
          <Button onClick={handleSave} className="w-full bg-indigo-600 h-14 font-bold rounded-2xl shadow-lg shadow-indigo-100"><Save className="w-4 h-4 mr-2" /> Salvar Alterações</Button>
        </Card>
      )}
    </div>
  );
};

export default ProProfile;