"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  MapPin, Edit3, Save, X, Loader2, Camera, Upload
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { getSafeImageUrl } from '@/utils/url-validator';

const ClientProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload para o bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Atualizar no banco de dados imediatamente
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setFormData({ ...formData, avatar_url: publicUrl });
      setProfile({ ...profile, avatar_url: publicUrl });
      showSuccess("Foto de perfil atualizada!");
    } catch (error: any) {
      console.error("Erro no upload:", error);
      showError(error.message || "Erro ao fazer upload da imagem.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: formData.full_name,
        email: formData.email,
        bio: formData.bio,
        location: formData.location,
        avatar_url: formData.avatar_url,
        contractor_type: formData.contractor_type,
        main_event_type: formData.main_event_type,
        phone: formData.phone
      }).eq('id', profile.id);

      if (error) throw error;
      
      setProfile(formData);
      setIsEditing(false);
      showSuccess("Perfil atualizado!");
    } catch (error: any) {
      showError(error.message);
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

  const safeAvatar = getSafeImageUrl(formData.avatar_url, `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.full_name}`);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <Card className="p-8 border-none shadow-2xl bg-white rounded-[2.5rem]">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          <div className="relative shrink-0 group">
            <div className="w-40 h-40 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-100 relative">
              {uploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Loader2 className="animate-spin text-white" />
                </div>
              ) : null}
              <img src={safeAvatar} className="w-full h-full object-cover" alt="Avatar" />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold gap-2"
              >
                <Camera className="w-6 h-6" />
                Alterar Foto
              </button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileUpload} 
            />
          </div>

          <div className="flex-1 space-y-6 w-full">
            <div className="flex justify-between items-start">
              <div className="space-y-2 w-full">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Nome Completo</Label>
                      <Input value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="bg-slate-50 border-none h-12 rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Localização</Label>
                      <Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="bg-slate-50 border-none h-12 rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase text-slate-400">E-mail de Contato</Label>
                      <Input value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-slate-50 border-none h-12 rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Tipo de Contratante</Label>
                      <Input value={formData.contractor_type || ''} onChange={(e) => setFormData({ ...formData, contractor_type: e.target.value })} className="bg-slate-50 border-none h-12 rounded-xl" placeholder="Pessoa Fisica, Empresa, Agencia..." />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Tipo de Evento Principal</Label>
                      <Input value={formData.main_event_type || ''} onChange={(e) => setFormData({ ...formData, main_event_type: e.target.value })} className="bg-slate-50 border-none h-12 rounded-xl" placeholder="Casamento, Corporativo, Show..." />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Telefone (privado)</Label>
                      <Input value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="bg-slate-50 border-none h-12 rounded-xl" />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-4xl font-black text-slate-900">{profile.full_name}</h1>
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                      <MapPin className="w-4 h-4 text-blue-600" /> {profile.location || "Local não definido"}
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button onClick={() => setIsEditing(false)} variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 rounded-xl"><X /></Button>
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-100"><Save className="w-4 h-4 mr-2" /> Salvar</Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="rounded-xl border-slate-200"><Edit3 className="w-4 h-4 mr-2" /> Editar Perfil</Button>
                )}
              </div>
            </div>
            
            {isEditing ? (
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Sobre Você / Empresa</Label>
                <Textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="min-h-[120px] bg-slate-50 border-none rounded-2xl" placeholder="Conte um pouco sobre você ou sua empresa..." />
              </div>
            ) : (
              <p className="text-slate-600 leading-relaxed font-medium">{profile.bio || "Nenhuma descrição adicionada."}</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ClientProfile;
