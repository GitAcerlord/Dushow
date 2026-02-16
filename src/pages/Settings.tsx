"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [prefs, setPrefs] = useState({
    darkMode: false,
    emailNotifications: true,
    showProfilePublic: true,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData.user;
        if (!user) return;

        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (error) throw error;

        setProfile(data);
        setPrefs({
          darkMode: !!data?.pref_dark_mode,
          emailNotifications: data?.pref_email_notifications ?? true,
          showProfilePublic: data?.pref_public_profile ?? true,
        });
        if (data?.pref_dark_mode) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
      } catch (error: any) {
        showError(error.message || "Erro ao carregar configurações.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      if (!profile?.id) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          pref_dark_mode: prefs.darkMode,
          pref_email_notifications: prefs.emailNotifications,
          pref_public_profile: prefs.showProfilePublic,
        })
        .eq("id", profile.id);
      if (error) throw error;

      if (prefs.darkMode) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      showSuccess("Configurações salvas.");
    } catch (error: any) {
      showError(error.message || "Erro ao salvar configurações.");
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="animate-spin text-[#2D1B69] w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Configurações da Conta</h1>
          <p className="text-slate-500">Ajustes gerais válidos para todos os perfis/contextos.</p>
        </div>
        <Button onClick={handleSave} className="bg-[#2D1B69]">
          <Save className="w-4 h-4 mr-2" /> Salvar
        </Button>
      </div>

      <Card className="p-6 space-y-6 rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <Label>Modo Escuro</Label>
            <p className="text-xs text-slate-500">Preferência de interface.</p>
          </div>
          <Switch checked={prefs.darkMode} onCheckedChange={(value: boolean) => setPrefs({ ...prefs, darkMode: value })} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Notificações por E-mail</Label>
            <p className="text-xs text-slate-500">Alertas de propostas, contratos e status.</p>
          </div>
          <Switch checked={prefs.emailNotifications} onCheckedChange={(value: boolean) => setPrefs({ ...prefs, emailNotifications: value })} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Perfil Público</Label>
            <p className="text-xs text-slate-500">Controla visibilidade pública do perfil profissional.</p>
          </div>
          <Switch checked={prefs.showProfilePublic} onCheckedChange={(value: boolean) => setPrefs({ ...prefs, showProfilePublic: value })} />
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-sm font-bold mb-3">Conta</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nome</Label>
              <Input value={profile?.full_name || ""} readOnly />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input value={profile?.email || ""} readOnly />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
