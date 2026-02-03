"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ShieldCheck, 
  Star, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Clock,
  DollarSign,
  FileSearch
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { showSuccess, showError } from "@/utils/toast";

const MOCK_APPROVALS = [
  { 
    id: 1, 
    name: "DJ Alok", 
    type: "SUPERSTAR", 
    paymentStatus: "CONFIRMADO", 
    requestDate: "12/05/2024",
    docs: "Completo",
    price: 149.90
  },
  { 
    id: 2, 
    name: "Mariana Voz", 
    type: "VERIFICADO", 
    paymentStatus: "CONFIRMADO", 
    requestDate: "14/05/2024",
    docs: "Pendente Análise",
    price: 49.90
  },
  { 
    id: 3, 
    name: "Banda Rock On", 
    type: "VERIFICADO", 
    paymentStatus: "AGUARDANDO", 
    requestDate: "15/05/2024",
    docs: "Completo",
    price: 49.90
  }
];

const AdminApprovals = () => {
  const handleApprove = (name: string, type: string) => {
    showSuccess(`Selo ${type} concedido para ${name}! O perfil agora ostenta o selo oficial.`);
  };

  const handleReject = (name: string) => {
    showError(`Solicitação de ${name} rejeitada. O usuário será notificado para corrigir os dados.`);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Aprovação de Selos</h1>
          <p className="text-slate-500 mt-1">Valide a autenticidade dos perfis que adquiriram selos de destaque.</p>
        </div>
        <div className="flex gap-4">
          <Card className="px-4 py-2 border-none shadow-sm bg-white flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
            <span className="text-sm font-bold text-slate-700">12 Pendentes</span>
          </Card>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-none shadow-sm bg-indigo-600 text-white">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-6 h-6 text-indigo-200" />
            <h3 className="font-bold">Selo Verificado</h3>
          </div>
          <p className="text-3xl font-bold">R$ 49,90</p>
          <p className="text-indigo-100 text-xs mt-2">Taxa única de validação de identidade.</p>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-amber-500 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Star className="w-6 h-6 text-amber-200" />
            <h3 className="font-bold">Selo Superstar</h3>
          </div>
          <p className="text-3xl font-bold">R$ 149,90</p>
          <p className="text-amber-50 text-xs mt-2">Assinatura mensal com destaque máximo.</p>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            <h3 className="font-bold text-slate-900">Receita de Selos</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">R$ 4.250,00</p>
          <p className="text-slate-400 text-xs mt-2">Total acumulado nos últimos 30 dias.</p>
        </Card>
      </div>

      {/* Approvals Table */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold text-slate-900">Fila de Verificação</h3>
        </div>
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Artista</TableHead>
              <TableHead>Selo Solicitado</TableHead>
              <TableHead>Pagamento (ASAAS)</TableHead>
              <TableHead>Documentação</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_APPROVALS.map((req) => (
              <TableRow key={req.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${req.name}`} />
                      <AvatarFallback>{req.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-slate-900 text-sm">{req.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={req.type === 'SUPERSTAR' ? 'bg-amber-500' : 'bg-blue-500'}>
                    {req.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      req.paymentStatus === 'CONFIRMADO' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}></div>
                    <span className={`text-xs font-bold ${
                      req.paymentStatus === 'CONFIRMADO' ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {req.paymentStatus}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" className="text-indigo-600 gap-2 h-8">
                    <FileSearch className="w-4 h-4" />
                    Revisar Docs
                  </Button>
                </TableCell>
                <TableCell className="text-xs text-slate-500">
                  {req.requestDate}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600 border-red-100 hover:bg-red-50"
                      onClick={() => handleReject(req.name)}
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Rejeitar
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-emerald-600 hover:bg-emerald-700"
                      disabled={req.paymentStatus !== 'CONFIRMADO'}
                      onClick={() => handleApprove(req.name, req.type)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Aprovar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminApprovals;