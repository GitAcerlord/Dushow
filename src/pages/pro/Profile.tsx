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
    // VALIDAÇÃO OBRIGATÓRIA: Impede salvar sem URL de imagem
    if (!newImageUrl.trim() || !newImageUrl.startsWith('http')) {
      showError("Uma URL de imagem válida é obrigatória para o portfólio.");
      return;
    }

    const updatedUrls = [...(profile.portfolio_urls || []), newImageUrl];
    try {
      const { error } = await supabase.from('profiles').update({ portfolio_urls: updatedUrls }).eq('id', profile.id);
      if (error) throw error;
      setProfile({ ...profile, portfolio_urls: updatedUrls });
      setNewImageUrl("");
      showSuccess("Imagem adicionada ao portfólio!");
    } catch (error: any) {
      showError("Erro ao persistir imagem no banco.");
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

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <Card className="p-8 border-none shadow-2xl bg-white rounded-[2.5rem]">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          <div className="relative shrink-0">
            <div className="w-40 h-40 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-100">
              <img src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.full_name}`} className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-black text-slate-900">{profile.full_name}</h1>
                <div className="flex gap-2 mt-2">
                  {profile.areas_of_activity?.map((area: string) => (
                    <Badge key={area} className="bg-indigo-50 text-indigo-600 border-none">{area}</Badge>
                  ))}
                </div>
              </div>
              <Button onClick={() => setIsEditing(!isEditing)} variant="outline" className="rounded-xl">
                {isEditing ? "Cancelar" : "Editar Perfil"}
              </Button>
            </div>
            <p className="text-slate-600 leading-relaxed">{profile.bio || "Sem biografia definida."}</p>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-black text-slate-900">Meu Portfólio (Obrigatório)</h3>
          <div className="flex gap-2">
            <Input 
              placeholder="URL da imagem (obrigatório)..." 
              value={newImageUrl} 
              onChange={(e) => setNewImageUrl(e.target.value)}
              className="bg-white border-slate-200 rounded-xl w-64"
            />
            <Button onClick={addPortfolioImage} className="bg-indigo-600 rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Adicionar Foto
            </Button>
          </div>
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