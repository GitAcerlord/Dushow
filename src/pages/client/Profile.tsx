"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  User, MapPin, Edit3, Save, X, Loader2, Camera
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { isValidImageUrl, getSafeImageUrl } from '@/utils/url-validator';

const ClientProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>({});

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
    if (formData.avatar_url && !isValidImageUrl(formData.avatar_url)) {
      showError("URL de imagem não permitida.");
      return;
    }

    try {
      const { error } = await supabase.from('profiles').update({
        full_name: formData.full_name,
        bio: formData.bio,
        location: formData.location,
        avatar_url: formData.avatar_url
      }).eq('id', profile.id);

      if (error) throw error;
      
      setProfile(formData);
      setIsEditing(false);
      showSuccess("Perfil atualizado!");
    } catch (error: any) {
      showError(error.message);
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  const safeAvatar = getSafeImageUrl(formData.avatar_url, `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.full_name}`);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <Card className="p-8 border-none shadow-2xl bg-white rounded-[2.5rem]">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          <div className="relative shrink-0">
            <div className="w-40 h-40 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-100">
              <img src={safeAvatar} className="w-full h-full object-cover" alt="Avatar" />
            </div>
            {isEditing && (
              <div className="mt-4 space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-400">URL da Foto</Label>
                <Input 
                  value={formData.avatar_url || ""} 
                  onChange={(e) => setFormData({...formData, avatar_url: e.target.value})}
                  className="h-8 text-xs bg-slate-50 border-none"
                  placeholder="https://..."
                />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-6 w-full">
            <div className="flex justify-between items-start">
              <div className="space-y-2 w-full">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label>Nome Completo</Label>
                      <Input value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <Label>Localização</Label>
                      <Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-4xl font-black text-slate-900">{profile.full_name}</h1>
                    <div className="flex items-center gap-2 text-slate-500">
                      <MapPin className="w-4 h-4" /> {profile.location || "Local não definido"}
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button onClick={() => setIsEditing(false)} variant="ghost" size="icon" className="text-red-500"><X /></Button>
                    <Button onClick={handleSave} className="bg-blue-600"><Save className="w-4 h-4 mr-2" /> Salvar</Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="rounded-xl"><Edit3 className="w-4 h-4 mr-2" /> Editar</Button>
                )}
              </div>
            </div>
            
            {isEditing ? (
              <div className="space-y-2">
                <Label>Sobre Você / Empresa</Label>
                <Textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="min-h-[100px]" />
              </div>
            ) : (
              <p className="text-slate-600 leading-relaxed">{profile.bio || "Nenhuma descrição adicionada."}</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ClientProfile;