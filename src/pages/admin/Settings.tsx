"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Percent, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Mail, 
  Lock,
  Save,
  RefreshCw
} from "lucide-react";
import { showSuccess } from "@/utils/toast";

const AdminSettings = () => {
  const handleSave = () => {
    showSuccess("Configurações salvas com sucesso! As alterações já estão em vigor.");
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
          <p className="text-slate-500 mt-1">Gerencie as regras de negócio e parâmetros globais da plataforma.</p>
        </div>
        <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
          <Save className="w-4 h-4" />
          Salvar Alterações
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-white border p-1 rounded-xl h-12">
          <TabsTrigger value="general" className="rounded-lg gap-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">
            <Globe className="w-4 h-4" /> Geral
          </TabsTrigger>
          <TabsTrigger value="finance" className="rounded-lg gap-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">
            <Percent className="w-4 h-4" /> Financeiro
          </TabsTrigger>
          <TabsTrigger value="gamification" className="rounded-lg gap-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">
            <Zap className="w-4 h-4" /> Gamificação
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg gap-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">
            <Lock className="w-4 h-4" /> Integrações
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card className="p-8 border-none shadow-sm bg-white space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label htmlFor="site-name">Nome da Plataforma</Label>
                <Input id="site-name" defaultValue="DUSHOW SaaS" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-email">E-mail de Suporte</Label>
                <Input id="support-email" defaultValue="ajuda@dushow.com.br" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintenance">Modo Manutenção</Label>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <Switch id="maintenance" />
                  <span className="text-sm text-slate-600">Desativar acesso público temporariamente</span>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Finance Settings */}
        <TabsContent value="finance">
          <Card className="p-8 border-none shadow-sm bg-white space-y-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Taxas de Comissão</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Plano Free (%)</Label>
                  <div className="relative">
                    <Input type="number" defaultValue="20" className="pr-8" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Plano Pro (%)</Label>
                  <div className="relative">
                    <Input type="number" defaultValue="15" className="pr-8" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Plano Superstar (%)</Label>
                  <div className="relative">
                    <Input type="number" defaultValue="10" className="pr-8" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Regras de Saque</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Valor Mínimo para Saque</Label>
                  <Input defaultValue="R$ 100,00" />
                </div>
                <div className="space-y-2">
                  <Label>Prazo de Liberação (Dias)</Label>
                  <Input type="number" defaultValue="2" />
                  <p className="text-xs text-slate-400">Dias após a conclusão do evento para liberar o saldo.</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Gamification Settings */}
        <TabsContent value="gamification">
          <Card className="p-8 border-none shadow-sm bg-white space-y-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Pontuação por Engajamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Novo Post no Feed</p>
                    <p className="text-xs text-slate-500">Pontos ganhos ao publicar conteúdo</p>
                  </div>
                  <Input className="w-20 text-center font-bold" defaultValue="10" />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Contrato Concluído</p>
                    <p className="text-xs text-slate-500">Pontos por cada show realizado</p>
                  </div>
                  <Input className="w-20 text-center font-bold" defaultValue="100" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Avaliação 5 Estrelas</p>
                    <p className="text-xs text-slate-500">Bônus por excelência no serviço</p>
                  </div>
                  <Input className="w-20 text-center font-bold" defaultValue="50" />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Perfil 100% Completo</p>
                    <p className="text-xs text-slate-500">Recompensa única de onboarding</p>
                  </div>
                  <Input className="w-20 text-center font-bold" defaultValue="200" />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Integrations Settings */}
        <TabsContent value="security">
          <Card className="p-8 border-none shadow-sm bg-white space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <RefreshCw className="text-blue-600 w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">ASAAS Gateway</h3>
                  <p className="text-sm text-slate-500">Processamento de pagamentos e split de comissões.</p>
                </div>
              </div>
              <Badge className="bg-emerald-500">Conectado</Badge>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label>API Key (Produção)</Label>
                <Input type="password" value="****************************************" readOnly />
              </div>
              <div className="space-y-2">
                <Label>Webhook Secret</Label>
                <Input type="password" value="********************" readOnly />
              </div>
              <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <Zap className="text-amber-600 w-5 h-5" />
                <p className="text-sm text-amber-800">
                  <strong>Atenção:</strong> Alterar as chaves de API pode interromper o processamento de pagamentos ativos.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;