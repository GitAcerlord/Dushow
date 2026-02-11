"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Edit3, Camera, Save, X, Loader2, Upload, Wallet, Trash2, Plus } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { getSafeImageUrl } from '@/utils/url-validator';

const ProProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
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
      const normalizedData = {
        ...data,
        portfolio_urls: data?.portfolio_urls || []
      };
      setProfile(normalizedData);
      setFormData(normalizedData);
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
        asaas_wallet_id: formData.asaas_wallet_id,
        portfolio_urls: formData.portfolio_urls || []
      }).eq('id', profile.id);

      if (error) throw error;

      setProfile(formData);
      setIsEditing(false);
      showSuccess("Perfil atualizado!");
    } catch (error: any) {
      showError(error.message || 'Erro ao salvar perfil.');
    }
  };

  const handlePortfolioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.id) return;

    if (!file.type.startsWith('image/')) {
      showError('Envie apenas imagens no portfólio.');
      return;
    }

    setUploadingPortfolio(true);
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${profile.id}/portfolio-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('portfolios')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('portfolios').getPublicUrl(fileName);
      const nextPortfolio = [...(formData.portfolio_urls || []), publicUrlData.publicUrl];
      const nextData = { ...formData, portfolio_urls: nextPortfolio };

      setFormData(nextData);

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ portfolio_urls: nextPortfolio })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      setProfile(nextData);
      showSuccess('Imagem adicionada ao portfólio.');
    } catch (error: any) {
      showError(error.message || 'Não foi possível enviar imagem. Verifique se o bucket "portfolios" existe no Supabase.');
    } finally {
      setUploadingPortfolio(false);
      if (portfolioInputRef.current) portfolioInputRef.current.value = '';
    }
  };

  const removePortfolioImage = async (index: number) => {
    const current = [...(formData.portfolio_urls || [])];
    current.splice(index, 1);

    setFormData({ ...formData, portfolio_urls: current });

    const { error } = await supabase
      .from('profiles')
      .update({ portfolio_urls: current })
      .eq('id', profile.id);

    if (error) {
      showError('Erro ao remover imagem do portfólio.');
      return;
    }

    setProfile({ ...profile, portfolio_urls: current });
    showSuccess('Imagem removida do portfólio.');
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
            <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={() => {}} />
          </div>

          <div className="flex-1 space-y-6 w-full">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-2 w-full">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Nome Artístico</Label>
                        <Input value={formData.full_name || ''} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="bg-slate-50 border-none h-12 rounded-xl" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Wallet ID Asaas (Para Receber)</Label>
                        <Input value={formData.asaas_wallet_id || ''} onChange={(e) => setFormData({ ...formData, asaas_wallet_id: e.target.value })} placeholder="Ex: 00000000-0000-0000-0000-000000000000" className="bg-blue-50 border-none h-12 rounded-xl font-mono text-xs" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Biografia</Label>
                      <Textarea value={formData.bio || ''} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} className="bg-slate-50 border-none rounded-xl min-h-[110px]" placeholder="Conte sua história e destaque seu diferencial." />
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
          </div>
        </div>
      </Card>

      <Card className="p-6 md:p-8 border-none shadow-xl bg-white rounded-[2rem] space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Portfólio</h2>
            <p className="text-sm text-slate-500">Mostre suas melhores imagens para quem quer contratar seu serviço.</p>
          </div>
          <div>
            <input
              ref={portfolioInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handlePortfolioUpload}
            />
            <Button
              onClick={() => portfolioInputRef.current?.click()}
              disabled={uploadingPortfolio}
              className="rounded-xl bg-indigo-600"
            >
              {uploadingPortfolio ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Adicionar imagem
            </Button>
          </div>
        </div>

        {(formData.portfolio_urls || []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center space-y-3">
            <Upload className="w-7 h-7 mx-auto text-slate-400" />
            <p className="font-bold text-slate-700">Seu portfólio ainda está vazio</p>
            <p className="text-sm text-slate-500">Envie imagens para aumentar suas chances de venda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(formData.portfolio_urls || []).map((url: string, index: number) => (
              <div key={`${url}-${index}`} className="relative group rounded-2xl overflow-hidden border border-slate-100 aspect-square">
                <img src={getSafeImageUrl(url, '')} className="w-full h-full object-cover" alt={`Portfólio ${index + 1}`} />
                <button
                  onClick={() => removePortfolioImage(index)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  aria-label="Remover imagem"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProProfile;
