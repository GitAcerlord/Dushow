import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { showSuccess } from '@/utils/toast';

type ThemeOption = 'light' | 'dark' | 'system';

type LocalSettings = {
  theme: ThemeOption;
  emailNotifications: boolean;
  pixAlerts: boolean;
};

const SETTINGS_KEY = 'dushow-pro-settings';

const applyTheme = (theme: ThemeOption) => {
  const root = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldUseDark = theme === 'dark' || (theme === 'system' && systemDark);
  root.classList.toggle('dark', shouldUseDark);
};

const ProSettings = () => {
  const [settings, setSettings] = useState<LocalSettings>({
    theme: 'system',
    emailNotifications: true,
    pixAlerts: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as LocalSettings;
      setSettings(parsed);
      applyTheme(parsed.theme);
      return;
    }
    applyTheme('system');
  }, []);

  const saveSettings = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    applyTheme(settings.theme);
    showSuccess('Configurações salvas com sucesso!');
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-black text-slate-900">Configurações</h1>

      <Card className="p-6 rounded-3xl border-none shadow-sm space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-bold">Tema</Label>
          <Select value={settings.theme} onValueChange={(value: ThemeOption) => setSettings((prev) => ({ ...prev, theme: value }))}>
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Selecione o tema" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Claro</SelectItem>
              <SelectItem value="dark">Escuro</SelectItem>
              <SelectItem value="system">Sistema</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
            <div>
              <p className="font-bold text-slate-900">Notificações por e-mail</p>
              <p className="text-xs text-slate-500">Receba updates sobre contratos e solicitações.</p>
            </div>
            <Switch checked={settings.emailNotifications} onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, emailNotifications: checked }))} />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
            <div>
              <p className="font-bold text-slate-900">Alertas de PIX e saques</p>
              <p className="text-xs text-slate-500">Avisos quando houver movimentação financeira.</p>
            </div>
            <Switch checked={settings.pixAlerts} onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, pixAlerts: checked }))} />
          </div>
        </div>

        <div>
          <Button onClick={saveSettings} className="bg-indigo-600 rounded-xl">Salvar configurações</Button>
        </div>
      </Card>
    </div>
  );
};

export default ProSettings;
