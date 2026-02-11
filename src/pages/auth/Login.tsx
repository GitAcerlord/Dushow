"use client";

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mic2, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

const loginSchema = z.object({
  email: z.string().email({ message: "E-mail inválido" }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const { error, data: authData } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      showSuccess("Bem-vindo de volta!");
      if (profile.role === 'ADMIN') navigate('/admin');
      else navigate('/app');
    } catch (error: any) {
      showError(error.message || "Erro ao entrar.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8 border-none shadow-2xl bg-white rounded-[2.5rem]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2D1B69] rounded-2xl mb-4 shadow-lg shadow-purple-100">
            <Mic2 className="text-[#FFB703] w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-[#2D1B69] tracking-tight">Entrar na DUSHOW</h1>
          <p className="text-slate-500 mt-2">Acesse sua conta para gerenciar seus shows.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input 
                {...register('email')}
                placeholder="seu@email.com" 
                className="pl-10 h-12 bg-slate-50 border-none rounded-xl focus-visible:ring-[#2D1B69]"
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha</Label>
              <Link to="/forgot-password" title="Recuperar senha" className="text-xs font-bold text-[#2D1B69] hover:underline">Esqueceu a senha?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input 
                {...register('password')}
                type="password" 
                placeholder="••••••••" 
                className="pl-10 h-12 bg-slate-50 border-none rounded-xl focus-visible:ring-[#2D1B69]"
              />
            </div>
            {errors.password && <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>}
          </div>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-14 bg-[#2D1B69] hover:bg-[#1a1040] text-white text-lg font-black rounded-2xl shadow-xl shadow-purple-100 transition-all"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                Entrar
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            Não tem uma conta? <Link to="/register" className="text-[#2D1B69] font-black hover:underline">Cadastre-se agora</Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;