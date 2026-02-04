"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Star, MapPin, Music, Edit3, Camera, CheckCircle2, Award, Save, X, Loader2, DollarSign, Briefcase, Image as ImageIcon
} from "lucide-react";
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from '@/utils/toast';

const ProProfile = () => {
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

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <Card className="p-8 border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden relative">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          <div className="relative shrink-0">
            <div className="w-40 h-40 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-100">
              <img src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.full_name}`} className="w-full h-full object-cover" />
            </div>
            {profile.is_superstar && (
              <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white p-2 rounded-xl shadow-lg">
                <Crown className="w-5 h-5" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-4xl font-black text-slate-900">{profile.full_name}</h1>
                  {profile.is_verified && <CheckCircle2 className="w-6 h-6 text-blue-500" />}
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.areas_of_activity?.map((area: string) => (
                    <Badge key={area} className="bg-indigo-50 text-indigo-600 border-none px-3 py-1">{area}</Badge>
                  )) || <Badge variant="outline">Defina suas áreas</Badge>}
                </div>
              </div>
              <Button onClick={() => setIsEditing(!isEditing)} variant="outline" className="rounded-xl border-slate-200">
                {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
                {isEditing ? "Cancelar" : "Editar"}
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl text-center">
                <p className="text-[10px] text-slate-400 font-black uppercase">Trabalhos</p>
                <p className="text-xl font-black text-slate-900">{profile.work_count || 0}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl text-center">
                <p className="text-[10px] text-slate-400 font-black uppercase">Avaliação</p>
                <p className="text-xl font-black text-slate-900">{profile.rating || '5.0'}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl text-center">
                <p className="text-[10px] text-slate-400 font-black uppercase">Cachê Base</p>
                <p className="text-xl font-black text-indigo-600">R$ {Number(profile.price).toLocaleString('pt-BR')}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Sobre Mim</h4>
              <p className="text-slate-600 leading-relaxed">{profile.bio || "Conte sua história aqui..."}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Portfólio Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-black text-slate-900">Portfólio</h3>
          <Button variant="ghost" className="text-indigo-600 font-bold"><Plus className="w-4 h-4 mr-2" /> Adicionar Mídia</Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-square bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300">
              <ImageIcon className="w-8 h-8" />
            </div>
          ))}
        </div>
      </div>

      {isEditing && (
        <Card className="p-8 border-none shadow-2xl bg-white rounded-[2.5rem] space-y-6">
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