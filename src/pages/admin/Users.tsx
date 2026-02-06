"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, MoreHorizontal, ShieldCheck, UserX, Loader2, CheckCircle2
} from "lucide-react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from "@/utils/toast";

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'ADMIN') {
        throw new Error("Acesso negado.");
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      showError(error.message || "Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string, name: string) => {
    setActionId(id);
    try {
      // SECURITY FIX: Use Edge Function to bypass restrictive triggers safely
      const { error } = await supabase.functions.invoke('admin-actions', {
        body: { 
          targetUserId: id, 
          updates: { is_verified: true } 
        }
      });

      if (error) throw error;
      showSuccess(`Usuário ${name} verificado.`);
      fetchUsers();
    } catch (error: any) {
      showError(error.message || "Erro ao verificar usuário.");
    } finally {
      setActionId(null);
    }
  };

  const filteredUsers = users.filter(u => u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-900">Gestão de Usuários</h1>
        <Input 
          placeholder="Buscar por nome..." 
          className="max-w-xs bg-white rounded-xl"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2rem]">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-500">Nenhum usuário encontrado ou acesso restrito.</TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>{user.full_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-sm">{user.full_name}</span>
                          {user.is_verified && <CheckCircle2 className="w-3 h-3 text-blue-500" />}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                    <TableCell><Badge className="bg-indigo-50 text-indigo-600 border-none uppercase text-[10px]">{user.plan_tier}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                        <span className="text-xs font-medium">{user.is_active ? 'Ativo' : 'Inativo'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={actionId === user.id}>
                            {actionId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreHorizontal className="w-4 h-4" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!user.is_verified && (
                            <DropdownMenuItem onClick={() => handleVerify(user.id, user.full_name)} className="text-blue-600">
                              <ShieldCheck className="w-4 h-4 mr-2" /> Verificar Perfil
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-red-600">
                            <UserX className="w-4 h-4 mr-2" /> Suspender
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default AdminUsers;