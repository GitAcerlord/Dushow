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
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setFormData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          bio: formData.bio,
          category: formData.category,
          location: formData.location,
          price: formData.price
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      setProfile(formData);
      setIsEditing(false);
      showSuccess("Perfil atualizado com sucesso!");
    } catch (error: any) {
      showError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <Card className="p-8 border-none shadow-sm bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-10"></div>
        
        <div className="relative flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-xl">
              <img src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.full_name}`} alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {isEditing ? (
              <Input 
                value={formData.full_name} 
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="text-2xl font-bold h-12"
              />
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900">{profile.full_name}</h1>
                <div className="flex gap-2">
                  {profile.is_verified && <Badge className="bg-blue-500 border-none gap-1"><CheckCircle2 className="w-3 h-3" /> Verificado</Badge>}
                  {profile.is_superstar && <Badge className="bg-amber-500 border-none gap-1"><Award className="w-3 h-3" /> Superstar</Badge>}
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Music className="w-4 h-4 text-indigo-600" /> {profile.category || 'Defina sua categoria'}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-600" /> {profile.location || 'Defina sua localização'}
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-current" /> {profile.rating} ({profile.reviews_count} avaliações)
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}><X className="w-4 h-4 mr-2" /> Cancelar</Button>
                <Button onClick={handleSave} disabled={saving} className="bg-indigo-600">
                  {saving ? <Loader2 className="animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Salvar</>}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} className="bg-indigo-600"><Edit3 className="w-4 h-4 mr-2" /> Editar Perfil</Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-6 border-none shadow-sm bg-white">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Sobre o Artista</h3>
            {isEditing ? (
              <Textarea 
                value={formData.bio} 
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                className="min-h-[150px]"
                placeholder="Conte sua história..."
              />
            ) : (
              <p className="text-slate-600 leading-relaxed">{profile.bio || 'Nenhuma biografia definida.'}</p>
            )}
          </Card>

          {isEditing && (
            <Card className="p-6 border-none shadow-sm bg-white space-y-6">
              <h3 className="text-lg font-bold text-slate-900">Configurações de Show</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Categoria Musical</Label>
                  <Input value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Localização</Label>
                  <Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Cachê Base (R$)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="pl-10" />
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-8">
          <Card className="p-6 border-none shadow-sm bg-white">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Estatísticas Reais</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Pontos Dushow</span>
                <span className="font-bold text-indigo-600">{profile.points} pts</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Cachê Atual</span>
                <span className="font-bold text-slate-900">R$ {Number(profile.price).toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProProfile;