"use client";

import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  FileText, 
  MoreHorizontal, 
  Eye, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  Filter,
  Download,
  DollarSign
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { showSuccess } from "@/utils/toast";

const MOCK_CONTRACTS = [
  { id: "CON-001", event: "Sunset Party", pro: "DJ Alok", client: "Clube Privilège", value: 15000, status: "PAID", date: "25/05/2024" },
  { id: "CON-002", event: "Casamento VIP", pro: "Banda Jazz In", client: "Ricardo Silva", value: 4500, status: "PENDING", date: "02/06/2024" },
  { id: "CON-003", event: "Aniversário 15 anos", pro: "Mariana Voz", client: "Ana Souza", value: 2200, status: "COMPLETED", date: "10/05/2024" },
  { id: "CON-004", event: "Festival de Inverno", pro: "DJ Alok", client: "Prefeitura Municipal", value: 25000, status: "NEGOTIATING", date: "15/07/2024" },
  { id: "CON-005", event: "Show Corporativo", pro: "Banda Rock On", client: "Tech Corp", value: 8000, status: "CANCELED", date: "20/04/2024" },
];

const AdminContracts = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID': return <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none">Pago</Badge>;
      case 'PENDING': return <Badge className="bg-amber-500 hover:bg-amber-600 border-none">Aguardando Pagto</Badge>;
      case 'COMPLETED': return <Badge className="bg-blue-500 hover:bg-blue-600 border-none">Concluído</Badge>;
      case 'NEGOTIATING': return <Badge className="bg-slate-500 hover:bg-slate-600 border-none">Em Negociação</Badge>;
      case 'CANCELED': return <Badge variant="destructive">Cancelado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Monitoramento de Contratos</h1>
          <p className="text-slate-500 mt-1">Acompanhe o fluxo de negociações e pagamentos da plataforma.</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exportar Relatório
        </Button>
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Contratos Ativos</p>
              <h3 className="text-2xl font-bold text-slate-900">42</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Volume em Trânsito</p>
              <h3 className="text-2xl font-bold text-slate-900">R$ 84.500,00</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Pendências de Pagto</p>
              <h3 className="text-2xl font-bold text-slate-900">08</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <div className="p-6 border-b flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              placeholder="Buscar por evento, artista ou cliente..." 
              className="pl-10 bg-slate-50 border-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtros Avançados
          </Button>
        </div>

        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>ID / Evento</TableHead>
              <TableHead>Artista</TableHead>
              <TableHead>Contratante</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Data do Show</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_CONTRACTS.map((contract) => (
              <TableRow key={contract.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{contract.event}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{contract.id}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm font-medium text-slate-600">{contract.pro}</TableCell>
                <TableCell className="text-sm text-slate-600">{contract.client}</TableCell>
                <TableCell className="text-sm font-bold text-slate-900">
                  R$ {contract.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-sm text-slate-500">{contract.date}</TableCell>
                <TableCell>{getStatusBadge(contract.status)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Gerenciar</DropdownMenuLabel>
                      <DropdownMenuItem className="gap-2">
                        <Eye className="w-4 h-4" /> Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <FileText className="w-4 h-4" /> Baixar PDF
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2 text-amber-600">
                        <AlertTriangle className="w-4 h-4" /> Abrir Disputa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminContracts;