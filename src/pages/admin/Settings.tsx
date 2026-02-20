"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Percent, Zap, Globe, Lock, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

type SettingsState = {
  siteName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  feeFree: number;
  feePro: number;
  feeSuperstar: number;
  withdrawalMinimum: number;
  withdrawalDays: number;
  pointsPost: number;
  pointsContract: number;
  pointsFiveStars: number;
  pointsFullProfile: number;
  asaasConnected: boolean;
};

const DEFAULT_SETTINGS: SettingsState = {
  siteName: "DUSHOW SaaS",
  supportEmail: "ajuda@dushow.com.br",
  maintenanceMode: false,
  feeFree: 20,
  feePro: 15,
  feeSuperstar: 10,
  withdrawalMinimum: 100,
  withdrawalDays: 2,
  pointsPost: 10,
  pointsContract: 100,
  pointsFiveStars: 50,
  pointsFullProfile: 200,
  asaasConnected: true,
};

const SETTINGS_TABLE = "admin_platform_settings";
const SETTINGS_KEY = "global";

const AdminSettings = () => {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tableUnavailable, setTableUnavailable] = useState(false);

  const mergeSettings = (payload: Partial<SettingsState> | null | undefined) => {
    setSettings((prev) => ({ ...prev, ...(payload || {}) }));
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(SETTINGS_TABLE)
        .select("setting_value")
        .eq("setting_key", SETTINGS_KEY)
        .maybeSingle();

      if (error) {
        const message = String(error.message || "");
        if (message.includes(`relation "${SETTINGS_TABLE}" does not exist`)) {
          setTableUnavailable(true);
          return;
        }
        throw error;
      }

      setTableUnavailable(false);
      mergeSettings((data?.setting_value as Partial<SettingsState>) || {});
    } catch (error: any) {
      showError(error.message || "Erro ao carregar configuracoes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const payload = useMemo(() => {
    return {
      setting_key: SETTINGS_KEY,
      setting_value: settings,
      updated_at: new Date().toISOString(),
    };
  }, [settings]);

  const handleSave = async () => {
    if (tableUnavailable) {
      showError("Tabela de configuracoes nao encontrada. Aplique a migration SQL 14 antes de salvar.");
      return;
    }

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from(SETTINGS_TABLE).upsert(
        {
          ...payload,
          updated_by: userData.user?.id || null,
        },
        { onConflict: "setting_key" },
      );

      if (error) throw error;
      showSuccess("Configuracoes salvas com sucesso.");
    } catch (error: any) {
      showError(error.message || "Falha ao salvar configuracoes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-20 flex justify-center">
        <Loader2 className="animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configuracoes</h1>
          <p className="text-slate-500 mt-1">Gerencie regras de negocio e parametros globais da plataforma.</p>
        </div>
        <Button onClick={handleSave} disabled={saving || tableUnavailable} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Alteracoes
        </Button>
      </div>

      {tableUnavailable && (
        <Card className="p-4 border border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800">
            A tabela <code>{SETTINGS_TABLE}</code> ainda nao existe neste ambiente. Rode a migration
            <code> backend/sql/14_admin_platform_settings.sql</code> para habilitar persistencia.
          </p>
        </Card>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-white border p-1 rounded-xl h-12">
          <TabsTrigger value="general" className="rounded-lg gap-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">
            <Globe className="w-4 h-4" /> Geral
          </TabsTrigger>
          <TabsTrigger value="finance" className="rounded-lg gap-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">
            <Percent className="w-4 h-4" /> Financeiro
          </TabsTrigger>
          <TabsTrigger
            value="gamification"
            className="rounded-lg gap-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600"
          >
            <Zap className="w-4 h-4" /> Gamificacao
          </TabsTrigger>
          <TabsTrigger value="integrations" className="rounded-lg gap-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">
            <Lock className="w-4 h-4" /> Integracoes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="p-8 border-none shadow-sm bg-white space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label htmlFor="site-name">Nome da Plataforma</Label>
                <Input id="site-name" value={settings.siteName} onChange={(e) => updateSetting("siteName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-email">E-mail de Suporte</Label>
                <Input
                  id="support-email"
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => updateSetting("supportEmail", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintenance">Modo Manutencao</Label>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <Switch id="maintenance" checked={settings.maintenanceMode} onCheckedChange={(value) => updateSetting("maintenanceMode", value)} />
                  <span className="text-sm text-slate-600">Desativar acesso publico temporariamente</span>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="finance">
          <Card className="p-8 border-none shadow-sm bg-white space-y-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Taxas de Comissao</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <NumberField label="Plano Free (%)" value={settings.feeFree} onChange={(value) => updateSetting("feeFree", value)} />
                <NumberField label="Plano Pro (%)" value={settings.feePro} onChange={(value) => updateSetting("feePro", value)} />
                <NumberField
                  label="Plano Superstar (%)"
                  value={settings.feeSuperstar}
                  onChange={(value) => updateSetting("feeSuperstar", value)}
                />
              </div>
            </div>

            <div className="pt-6 border-t">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Regras de Saque</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <NumberField
                  label="Valor Minimo para Saque (R$)"
                  value={settings.withdrawalMinimum}
                  onChange={(value) => updateSetting("withdrawalMinimum", value)}
                />
                <NumberField
                  label="Prazo de Liberacao (Dias)"
                  value={settings.withdrawalDays}
                  onChange={(value) => updateSetting("withdrawalDays", value)}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="gamification">
          <Card className="p-8 border-none shadow-sm bg-white space-y-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Pontuacao por Engajamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ScoreField title="Novo Post no Feed" subtitle="Pontos por publicacao" value={settings.pointsPost} onChange={(value) => updateSetting("pointsPost", value)} />
              <ScoreField
                title="Contrato Concluido"
                subtitle="Pontos por show realizado"
                value={settings.pointsContract}
                onChange={(value) => updateSetting("pointsContract", value)}
              />
              <ScoreField
                title="Avaliacao 5 Estrelas"
                subtitle="Bonus por excelencia no servico"
                value={settings.pointsFiveStars}
                onChange={(value) => updateSetting("pointsFiveStars", value)}
              />
              <ScoreField
                title="Perfil 100% Completo"
                subtitle="Recompensa unica de onboarding"
                value={settings.pointsFullProfile}
                onChange={(value) => updateSetting("pointsFullProfile", value)}
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card className="p-8 border-none shadow-sm bg-white space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">ASAAS Gateway</h3>
                <p className="text-sm text-slate-500">Processamento de pagamentos e split de comissoes.</p>
              </div>
              <Badge className={settings.asaasConnected ? "bg-emerald-500" : "bg-red-500"}>
                {settings.asaasConnected ? "Conectado" : "Desconectado"}
              </Badge>
            </div>

            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-sm text-amber-800">
                Alteracao de segredos de integracao deve ser feita em variaveis seguras de ambiente (Supabase/host), nao no frontend.
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const NumberField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) => {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value || 0))}
        className="pr-8"
      />
    </div>
  );
};

const ScoreField = ({
  title,
  subtitle,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  value: number;
  onChange: (value: number) => void;
}) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
    <div>
      <p className="font-bold text-slate-900 text-sm">{title}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
    <Input className="w-20 text-center font-bold" type="number" value={value} onChange={(e) => onChange(Number(e.target.value || 0))} />
  </div>
);

export default AdminSettings;
