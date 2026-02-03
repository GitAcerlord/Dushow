"use client";

import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  UserPlus, 
  MoreHorizontal, 
  ShieldCheck, 
  UserX, 
  Mail,
  Filter,
  CheckCircle2,
  Clock
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

const MOCK_USERS = [
  { id: 1, name: "DJ Alok", email: "alok@music.com", role: "PRO", status: "Ativo", joined: "12/01/2024", verified: true },
  { id: 2, name: "Clube Privilège", email: "contato@privilege.com", role: "CLIENT", status: "Ativo", joined: "15/01/2024", verified: true },
  { id: 3, name: "Mariana Voz", email: "mari@voz.com", role: "PRO", status: "Pendente", joined: "20/02/2024", verified: false },
  { id: 4, name: "Ricardo Silva", email: "ricardo@gmail.com", role: "CLIENT", status: "Ativo", joined: "05/03/2024", verified: false },
  { id: 5, name: "Admin Master", email: "admin@dushow.com", role: "ADMIN", status: "Ativo", joined: "01/01/2024", verified: true },
  { id: 6, name: "Banda Rock On", email: "rock@on.com", role: "PRO", status: "Suspenso", joined: "10/02/2024", verified: false },
];

const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleVerify = (name: string) => {
    showSuccess(`Usuário ${name} verificado com sucesso!`);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestão de Usuários</h1>
          <p className="text-slate-500 mt-1">Controle de acessos, permissões e validação de perfis.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <UserPlus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Usuários", value: "1.240", color: "bg-blue-500" },
          { label: "Profissionais", value: "850", color: "bg-emerald-500" },
          { label: "Contratantes", value: "380", color: "bg-indigo-500" },
          { label: "Pendentes", value: "12", color: "bg-amber-500" },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 border-none shadow-sm bg-white">
            <p className="text-xs font-bold text-slate-400 uppercase">{stat.label}</p>
            <div className="flex items-center justify-between mt-2">
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
              <div className={`w-2 h-2 rounded-full ${stat.color}`}></div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters & Table */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <div className="p-6 border-b flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              placeholder="Buscar por nome ou email..." 
              className="pl-10 bg-slate-50 border-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Mail className="w-4 h-4" />
              Notificar Todos
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_USERS.map((user) => (
              <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-slate-900 text-sm">{user.name}</span>
                        {user.verified && <CheckCircle2 className="w-3 h-3 text-blue-500" />}
                      </div>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] font-bold uppercase ${
                    user.role === 'ADMIN' ? 'border-purple-200 text-purple-600 bg-purple-50' :
                    user.role === 'PRO' ? 'border-emerald-200 text-emerald-600 bg-emerald-50' :
                    'border-blue-200 text-blue-600 bg-blue-50'
                  }`}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      user.status === 'Ativo' ? 'bg-emerald-500' :
                      user.status === 'Pendente' ? 'bg-amber-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-xs font-medium text-slate-600">{user.status}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-slate-500">
                  {user.joined}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem className="gap-2">
                        <Mail className="w-4 h-4" /> Enviar Mensagem
                      </DropdownMenuItem>
                      {!user.verified && (
                        <DropdownMenuItem className="gap-2 text-blue-600" onClick={() => handleVerify(user.name)}>
                          <ShieldCheck className="w-4 h-4" /> Verificar Perfil
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2 text-red-600">
                        <UserX className="w-4 h-4" /> Suspender Conta
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

export default AdminUsers;