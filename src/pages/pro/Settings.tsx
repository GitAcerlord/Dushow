"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Sun, Moon, Bell, ShieldCheck, Save } from 'lucide-react';

const ProSettings = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>({});
  const [prefs, setPrefs] = useState({ darkMode: false, emailNotifications: true, showProfilePublic: true });

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data || {});
        setPrefs({
          darkMode: !!(data?.pref_dark_mode),
          emailNotifications: data?.pref_email_notifications ?? true,
          showProfilePublic: data?.pref_public_profile ?? true
        });
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      const { error } = await supabase.from('profiles').update({
        pref_dark_mode: prefs.darkMode,
        pref_email_notifications: prefs.emailNotifications,
        pref_public_profile: prefs.showProfilePublic
      }).eq('id', profile.id);
      if (error) throw error;
      showSuccess('Preferências salvas');
    } catch (err: any) {
      showError(err.message || 'Erro ao salvar preferências');
    }
  };

  if (loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-sm text-slate-500">Ajuste suas preferências de conta e visualização.</p>
        </div>
        <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700"><Save className="w-4 h-4 mr-2" />Salvar</Button>
      </div>

      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label>Modo Escuro</Label>
            <p className="text-xs text-slate-500">Ativa tema escuro na interface</p>
          </div>
          <Switch checked={prefs.darkMode} onCheckedChange={(v: boolean) => setPrefs({...prefs, darkMode: v})} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Notificações por E-mail</Label>
            <p className="text-xs text-slate-500">Receber novidades e alertas por e-mail</p>
          </div>
          <Switch checked={prefs.emailNotifications} onCheckedChange={(v: boolean) => setPrefs({...prefs, emailNotifications: v})} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Perfil Público</Label>
            <p className="text-xs text-slate-500">Exibir portfólio e perfil para buscadores</p>
          </div>
          <Switch checked={prefs.showProfilePublic} onCheckedChange={(v: boolean) => setPrefs({...prefs, showProfilePublic: v})} />
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-sm font-bold">Conta</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <Label>Nome</Label>
              <Input value={profile.full_name || ''} readOnly />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input value={profile.email || ''} readOnly />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProSettings;
