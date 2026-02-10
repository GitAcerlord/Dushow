"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Star, MapPin, Edit3, Camera, Save, X, Loader2, Wallet, DollarSign, ShieldCheck
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { getSafeImageUrl } from '@/utils/url-validator';
import CategorySelector from '@/components/pro/CategorySelector';

const ProProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const avatarInputRef = useRef<HTMLInputElement>(null);

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
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setFormData({ ...formData, avatar_url: publicUrl });
      setProfile({ ...profile, avatar_url: publicUrl });
      showSuccess("Foto de perfil atualizada!");
    } catch (error: any) {
      showError("Erro no upload: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: formData.full_name,
        bio: formData.bio,
        location: formData.location,
        base_fee: formData.base_fee,
        asaas_wallet_id: formData.asaas_wallet_id
      }).eq('id', profile.id);

      if (error) throw error;
      
      setProfile(formData);
      setIsEditing(false);
      showSuccess("Perfil atualizado com sucesso!");
    } catch (error: any) {
      showError(error.message);
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-indigo-600 w-10 h-10" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <Card className="p-8 border-none shadow-2xl bg-white rounded-[2.5rem]">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          <div className="relative shrink-0 group">
            <div className="w-40 h-40 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-100 relative">
              {uploading && <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10"><Loader2 className="animate-spin text-white" /></div>}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Nome Artístico</Label>
                      <Input value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="bg-slate-50 border-none h-12 rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Cachê Base (R$)</Label>
                      <Input type="number" value={formData.base_fee} onChange={(e) => setFormData({...formData, base_fee: e.target.value})} className="bg-blue-50 border-none h-12 rounded-xl font-bold text-blue-600" />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-4xl font-black text-slate-900">{profile.full_name}</h1>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-blue-50 text-blue-600 border-none px-3 py-1 font-bold flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> Cachê: R$ {Number(profile.base_fee).toLocaleString('pt-BR')}
                      </Badge>
                      {profile.is_verified && <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-1 font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Verificado</Badge>}
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
            
            {isEditing ? (
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Biografia Profissional</Label>
                <Textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="min-h-[120px] bg-slate-50 border-none rounded-2xl" placeholder="Conte sua trajetória artística..." />
              </div>
            ) : (
              <p className="text-slate-600 leading-relaxed font-medium">{profile.bio || "Nenhuma biografia adicionada."}</p>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-8 border-none shadow-xl bg-white rounded-[2.5rem]">
          <h3 className="text-xl font-black text-slate-900 mb-6">Categorias de Atuação</h3>
          <CategorySelector profileId={profile.id} />
        </Card>

        <Card className="p-8 border-none shadow-xl bg-slate-900 text-white rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg"><Wallet className="w-5 h-5" /></div>
            <h3 className="font-black">Dados Financeiros</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400">Wallet ID Asaas</Label>
              {isEditing ? (
                <Input value={formData.asaas_wallet_id} onChange={(e) => setFormData({...formData, asaas_wallet_id: e.target.value})} className="bg-white/10 border-none text-white h-10 rounded-lg font-mono text-xs" />
              ) : (
                <p className="text-xs font-mono text-indigo-300 truncate">{profile.asaas_wallet_id || "Não configurada"}</p>
              )}
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              O Wallet ID é necessário para receber os pagamentos dos seus shows via split automático.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProProfile;