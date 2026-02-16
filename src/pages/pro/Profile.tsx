"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Star, 
  MapPin, 
  Edit3, 
  Camera, 
  Save, 
  X, 
  Loader2, 
  DollarSign, 
  ShieldCheck,
  Layout,
  Upload,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Trash2
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
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
      if (updateError) throw updateError;

      setFormData({ ...formData, avatar_url: publicUrl });
      setProfile({ ...profile, avatar_url: publicUrl });
      showSuccess("Avatar atualizado!");
    } catch (e: any) {
      showError("Erro no upload do avatar.");
    } finally {
      setUploading(false);
    }
  };

  const handlePortfolioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);
      const fileName = `${profile.id}/portfolio/${Math.random()}-${file.name}`;
      const bucketCandidates = ['portfolios', 'portfolio', 'uploads', 'avatars'];
      let publicUrl: string | null = null;
      let lastUploadError: any = null;

      for (const bucket of bucketCandidates) {
        const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);
        if (!uploadError) {
          const { data: { publicUrl: url } } = supabase.storage.from(bucket).getPublicUrl(fileName);
          publicUrl = url;
          break;
        }
        lastUploadError = uploadError;
      }

      if (!publicUrl) throw lastUploadError || new Error("Nenhum bucket de upload disponível.");
      
      const newPortfolio = [...(profile.portfolio_urls || []), publicUrl];
      const { error: updateError } = await supabase.from('profiles').update({ portfolio_urls: newPortfolio }).eq('id', profile.id);
      if (updateError) throw updateError;

      setProfile({ ...profile, portfolio_urls: newPortfolio });
      showSuccess("Item adicionado ao portfólio!");
    } catch (e: any) {
      showError(e?.message || "Erro no upload do portfólio.");
    } finally {
      setUploading(false);
    }
  };

  const removePortfolioItem = async (url: string) => {
    const newPortfolio = profile.portfolio_urls.filter((item: string) => item !== url);
    const { error } = await supabase.from('profiles').update({ portfolio_urls: newPortfolio }).eq('id', profile.id);
    if (!error) {
      setProfile({ ...profile, portfolio_urls: newPortfolio });
      showSuccess("Item removido.");
    }
  };

  const handleSave = async () => {
    try {
      const payload: any = {
        full_name: formData.full_name,
        email: formData.email,
        bio: formData.bio,
        location: formData.location,
        base_fee: formData.base_fee
      };

      if (Object.prototype.hasOwnProperty.call(profile || {}, "subcategorias")) {
        payload.subcategorias = String(formData.event_types_text || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }

      const { error } = await supabase.from('profiles').update(payload).eq('id', profile.id);

      if (error) throw error;
      setProfile(formData);
      setIsEditing(false);
      showSuccess("Perfil salvo!");
    } catch (e: any) {
      showError("Erro ao salvar dados.");
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-[#2D1B69] w-10 h-10" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-10">
      {/* Bio Header Card */}
      <Card className="p-8 border-none shadow-2xl bg-white rounded-[2.5rem]">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          <div className="relative shrink-0 group">
            <div className="w-40 h-40 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-100 relative">
              <img src={getSafeImageUrl(formData.avatar_url, `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.full_name}`)} className="w-full h-full object-cover" alt="Avatar" />
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
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">E-mail de Contato</Label>
                      <Input
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-slate-50 border-none h-12 rounded-xl"
                        placeholder="seu@email.com"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Tipos de Eventos Realizados</Label>
                      <Input
                        value={formData.event_types_text ?? ((formData.subcategorias || []).join(", "))}
                        onChange={(e) => setFormData({ ...formData, event_types_text: e.target.value })}
                        className="bg-slate-50 border-none h-12 rounded-xl"
                        placeholder="Casamento, Corporativo, Festival..."
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-4xl font-black text-[#2D1B69]">{profile.full_name}</h1>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-blue-50 text-blue-600 border-none px-3 py-1 font-bold flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> Cachê: R$ {Number(profile.base_fee || 0).toLocaleString('pt-BR')}
                      </Badge>
                      {profile.is_verified && <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-1 font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Verificado</Badge>}
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <Button onClick={handleSave} className="bg-[#2D1B69] rounded-xl shadow-lg"><Save className="w-4 h-4 mr-2" /> Salvar</Button>
                ) : (
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="rounded-xl border-slate-200 font-bold"><Edit3 className="w-4 h-4 mr-2" /> Editar Bio</Button>
                )}
              </div>
            </div>
            
            {isEditing ? (
              <Textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="min-h-[120px] bg-slate-50 border-none rounded-2xl" placeholder="Sua trajetória artística..." />
            ) : (
              <p className="text-slate-600 leading-relaxed font-medium">{profile.bio || "Nenhuma biografia adicionada."}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Portfólio & Apresentação */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-8 border-none shadow-xl bg-white rounded-[2.5rem] space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-[#2D1B69] flex items-center gap-2">
              <Layout className="text-[#FFB703]" /> Portfólio & Materiais
            </h3>
            <div className="flex gap-2">
              <input type="file" ref={portfolioInputRef} className="hidden" accept="image/*" onChange={handlePortfolioUpload} />
              <Button onClick={() => portfolioInputRef.current?.click()} className="bg-[#2D1B69] rounded-xl gap-2">
                {uploading ? <Loader2 className="animate-spin" /> : <Upload className="w-4 h-4" />} Adicionar Item
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {profile.portfolio_urls?.map((url: string, i: number) => {
              const isPdf = url.toLowerCase().endsWith('.pdf');
              return (
                <div key={i} className="group relative aspect-square rounded-[2rem] overflow-hidden border-2 border-slate-50 bg-slate-50 shadow-inner">
                  {isPdf ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center">
                      <FileText className="w-12 h-12 text-blue-500" />
                      <span className="text-[10px] font-black uppercase text-slate-500">Documento PDF</span>
                    </div>
                  ) : (
                    <img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="icon" variant="ghost" className="text-white hover:bg-white/20" asChild>
                      <a href={url} target="_blank" rel="noreferrer"><ExternalLink size={20} /></a>
                    </Button>
                    <Button size="icon" variant="ghost" className="text-red-400 hover:bg-red-400/20" onClick={() => removePortfolioItem(url)}>
                      <Trash2 size={20} />
                    </Button>
                  </div>
                </div>
              );
            })}
            {(!profile.portfolio_urls || profile.portfolio_urls.length === 0) && (
              <div className="col-span-full py-10 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                <ImageIcon className="mx-auto mb-2 opacity-20" size={40} />
                <p className="text-xs font-medium">Faça upload de fotos do seu portfólio.</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t space-y-4">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">Tags e Tipos de Evento (Categorias Oficiais)</h4>
            {profile?.id ? <CategorySelector profileId={profile.id} onSave={fetchProfile} /> : null}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-8 border-none shadow-xl bg-slate-900 text-white rounded-[2.5rem] space-y-6">
            <div className="flex items-center gap-3">
              <h3 className="font-black">Financeiro por PIX</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400">Saques por PIX</Label>
                <p className="text-xs font-mono text-indigo-300 truncate bg-white/5 p-2 rounded-lg">
                  Defina sua chave PIX no momento do saque na aba Financeiro.
                </p>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed italic">
                Não usamos Wallet ID manual para repasse. O pagamento ao profissional é feito por transferência PIX.
              </p>
            </div>
          </Card>

          <Card className="p-8 border-none shadow-xl bg-white rounded-[2.5rem]">
            <h3 className="text-lg font-black text-[#2D1B69] mb-4">Estatísticas</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-bold uppercase">Membro desde</span>
                <span className="text-xs font-black text-[#2D1B69]">{new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-bold uppercase">Show Realizados</span>
                <Badge className="bg-emerald-50 text-emerald-600 border-none">{profile.work_count || 0}</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProProfile;
