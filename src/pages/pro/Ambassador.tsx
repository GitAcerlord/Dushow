"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Award, Share2, Building2, Instagram, User, CheckCircle2, Loader2, Zap, Copy, Edit2
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

const Ambassador = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [formData, setFormData] = useState({ company_name: "", instagram_handle: "", contact_name: "", contact_info: "" });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
      setNewCode(data.referral_code || "");
    }
    setLoading(false);
  };

  const handleUpdateCode = async () => {
    if (profile.referral_code_edited) return showError("O código só pode ser alterado uma vez.");
    
    try {
      const { error } = await supabase.from('profiles').update({ 
        referral_code: newCode,
        referral_code_edited: true 
      }).eq('id', profile.id);

      if (error) throw error;
      showSuccess("Código de embaixador atualizado!");
      setIsEditingCode(false);
      fetchProfile();
    } catch (e: any) {
      showError("Este código já está em uso ou é inválido.");
    }
  };

  const handleIndicate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // SECURITY: We only insert the indication. 
      // A database trigger (tr_indication_xp) now handles the XP award server-side.
      const { error } = await supabase.from('company_indications').insert({
        profile_id: profile.id,
        ...formData
      });
      if (error) throw error;

      showSuccess("Indicação enviada! XP adicionado à sua conta.");
      setFormData({ company_name: "", instagram_handle: "", contact_name: "", contact_info: "" });
    } catch (error: any) {
      showError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-amber-100 rounded-[2rem] flex items-center justify-center mx-auto text-amber-600 shadow-xl shadow-amber-100">
          <Award className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Programa de Embaixadores</h1>
        <p className="text-slate-500 max-w-lg mx-auto">Seja a cara da DUSHOW e ganhe prestígio, XP e benefícios exclusivos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8 border-none shadow-xl bg-white rounded-[2.5rem] space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Share2 className="w-5 h-5" /></div>
              <h3 className="font-black text-slate-900">Seu Código</h3>
            </div>
            {!profile.referral_code_edited && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditingCode(true)} className="text-indigo-600 font-bold">Alterar</Button>
            )}
          </div>

          {isEditingCode ? (
            <div className="space-y-3">
              <Input value={newCode} onChange={(e) => setNewCode(e.target.value.toLowerCase().replace(/\s+/g, ''))} className="h-12 bg-slate-50 border-none rounded-xl font-black text-indigo-600 uppercase" />
              <div className="flex gap-2">
                <Button onClick={handleUpdateCode} className="flex-1 bg-indigo-600 rounded-xl">Salvar</Button>
                <Button onClick={() => setIsEditingCode(false)} variant="ghost" className="flex-1">Cancelar</Button>
              </div>
              <p className="text-[10px] text-slate-400 text-center italic">Atenção: Você só pode alterar seu código uma única vez.</p>
            </div>
          ) : (
            <div className="p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-between">
              <span className="text-2xl font-black text-indigo-600 tracking-widest uppercase">{profile.referral_code || "NÃO DEFINIDO"}</span>
              <Button onClick={() => { navigator.clipboard.writeText(profile.referral_code); showSuccess("Copiado!"); }} variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600"><Copy className="w-5 h-5" /></Button>
            </div>
          )}
        </Card>

        <Card className="p-8 border-none shadow-xl bg-indigo-600 text-white rounded-[2.5rem] space-y-6 relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <h3 className="text-xl font-black">Regras de XP</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="w-4 h-4 text-indigo-200" /> Indicação de Empresa: <strong>+20 XP</strong></li>
              <li className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="w-4 h-4 text-indigo-200" /> Novo Profissional: <strong>+10 XP</strong></li>
            </ul>
          </div>
          <Zap className="absolute -right-10 -bottom-10 w-48 h-48 text-white/10 -rotate-12" />
        </Card>
      </div>

      <Card className="p-10 border-none shadow-2xl bg-white rounded-[3rem] space-y-8">
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-slate-900">Indicar Empresa Parceira</h3>
          <p className="text-slate-500">Conhece uma casa de shows, buffet ou empresa de eventos? Indique e ganhe XP.</p>
        </div>

        <form onSubmit={handleIndicate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400">Nome da Empresa</Label>
            <Input required value={formData.company_name} onChange={(e) => setFormData({...formData, company_name: e.target.value})} className="bg-slate-50 border-none h-12 rounded-xl" placeholder="Ex: Blue Note SP" />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400">Instagram (@)</Label>
            <Input value={formData.instagram_handle} onChange={(e) => setFormData({...formData, instagram_handle: e.target.value})} className="bg-slate-50 border-none h-12 rounded-xl" placeholder="@empresa" />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400">Nome do Responsável</Label>
            <Input value={formData.contact_name} onChange={(e) => setFormData({...formData, contact_name: e.target.value})} className="bg-slate-50 border-none h-12 rounded-xl" placeholder="Quem devemos procurar?" />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400">Contato (E-mail ou Tel)</Label>
            <Input required value={formData.contact_info} onChange={(e) => setFormData({...formData, contact_info: e.target.value})} className="bg-slate-50 border-none h-12 rounded-xl" placeholder="contato@empresa.com" />
          </div>
          <Button type="submit" disabled={submitting} className="md:col-span-2 h-14 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100">
            {submitting ? <Loader2 className="animate-spin" /> : "Enviar Indicação Profissional"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Ambassador;