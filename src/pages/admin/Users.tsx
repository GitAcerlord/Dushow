"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, ShieldCheck, UserX, Loader2, CheckCircle2, UserCheck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

type AdminUser = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  plan_tier?: string | null;
  is_active?: boolean | null;
  is_verified?: boolean | null;
  created_at?: string | null;
};

const AdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const withEmail = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, role, plan_tier, is_active, is_verified, created_at")
        .order("created_at", { ascending: false });

      if (!withEmail.error) {
        setUsers((withEmail.data as AdminUser[]) || []);
        return;
      }

      const withoutEmail = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role, plan_tier, is_active, is_verified, created_at")
        .order("created_at", { ascending: false });

      if (withoutEmail.error) throw withoutEmail.error;
      setUsers(((withoutEmail.data as AdminUser[]) || []).map((user) => ({ ...user, email: null })));
    } catch (error: any) {
      showError(error.message || "Erro ao carregar usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUser = async (id: string, updates: Record<string, unknown>) => {
    setActionId(id);
    try {
      const { error } = await supabase.functions.invoke("admin-actions", {
        body: {
          targetUserId: id,
          updates,
        },
      });

      if (error) throw error;
      await fetchUsers();
      return true;
    } catch (error: any) {
      showError(error.message || "Erro ao atualizar usuario.");
      return false;
    } finally {
      setActionId(null);
    }
  };

  const handleVerify = async (id: string, name: string) => {
    const success = await updateUser(id, { is_verified: true });
    if (success) showSuccess(`Usuario ${name || "selecionado"} verificado.`);
  };

  const handleToggleActive = async (user: AdminUser) => {
    const success = await updateUser(user.id, { is_active: !user.is_active });
    if (success) {
      showSuccess(user.is_active ? "Usuario suspenso com sucesso." : "Usuario reativado com sucesso.");
    }
  };

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) => {
      const name = (user.full_name || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      return name.includes(term) || email.includes(term);
    });
  }, [users, searchTerm]);

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-900">Gestao de Usuarios</h1>
        <Input
          placeholder="Buscar por nome ou email..."
          className="max-w-xs bg-white rounded-xl"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2rem]">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                    Nenhum usuario encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>{(user.full_name || "?").slice(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-sm">{user.full_name || "Sem nome"}</span>
                            {user.is_verified && <CheckCircle2 className="w-3 h-3 text-blue-500" />}
                          </div>
                          <span className="text-xs text-slate-500">{user.email || "Sem email"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.role || "N/A"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-indigo-50 text-indigo-600 border-none uppercase text-[10px]">
                        {user.plan_tier || "free"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${user.is_active ? "bg-emerald-500" : "bg-slate-300"}`} />
                        <span className="text-xs font-medium">{user.is_active ? "Ativo" : "Inativo"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={actionId === user.id}>
                            {actionId === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="w-4 h-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!user.is_verified && (
                            <DropdownMenuItem onClick={() => handleVerify(user.id, user.full_name || "")} className="text-blue-600">
                              <ShieldCheck className="w-4 h-4 mr-2" /> Verificar Perfil
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleToggleActive(user)}
                            className={user.is_active ? "text-red-600" : "text-emerald-600"}
                          >
                            {user.is_active ? <UserX className="w-4 h-4 mr-2" /> : <UserCheck className="w-4 h-4 mr-2" />}
                            {user.is_active ? "Suspender" : "Reativar"}
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
