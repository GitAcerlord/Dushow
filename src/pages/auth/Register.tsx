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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Mic2, User, Music, Briefcase, ArrowRight, Loader2, Mail, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

const registerSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  email: z.string().email({ message: "E-mail inválido" }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
  role: z.enum(['PRO', 'CLIENT'], { required_error: "Selecione seu tipo de perfil" }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'PRO' }
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
            role: data.role,
          }
        }
      });

      if (error) throw error;

      showSuccess("Conta criada! Verifique seu e-mail.");
      navigate('/login');
    } catch (error: any) {
      showError(error.message || "Erro ao criar conta.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 py-12">
      <Card className="max-w-xl w-full p-8 border-none shadow-2xl bg-white rounded-[2.5rem]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2D1B69] rounded-2xl mb-4 shadow-lg shadow-purple-100">
            <Mic2 className="text-[#FFB703] w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-[#2D1B69] tracking-tight">Criar sua conta</h1>
          <p className="text-slate-500 mt-2">Junte-se à maior plataforma artística do Brasil.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">Eu sou um...</Label>
            <RadioGroup 
              defaultValue="PRO" 
              onValueChange={(val) => setValue('role', val as 'PRO' | 'CLIENT')}
              className="grid grid-cols-2 gap-4"
            >
              <Label
                htmlFor="role-pro"
                className={`flex flex-col items-center justify-center p-6 border-2 rounded-2xl cursor-pointer transition-all ${
                  selectedRole === 'PRO' ? 'border-[#2D1B69] bg-purple-50 shadow-md' : 'border-slate-100 hover:bg-slate-50'
                }`}
              >
                <RadioGroupItem value="PRO" id="role-pro" className="sr-only" />
                <Music className={`w-8 h-8 mb-2 ${selectedRole === 'PRO' ? 'text-[#2D1B69]' : 'text-slate-300'}`} />
                <span className="text-sm font-black uppercase tracking-wider">Artista</span>
              </Label>

              <Label
                htmlFor="role-client"
                className={`flex flex-col items-center justify-center p-6 border-2 rounded-2xl cursor-pointer transition-all ${
                  selectedRole === 'CLIENT' ? 'border-[#2D1B69] bg-purple-50 shadow-md' : 'border-slate-100 hover:bg-slate-50'
                }`}
              >
                <RadioGroupItem value="CLIENT" id="role-client" className="sr-only" />
                <Briefcase className={`w-8 h-8 mb-2 ${selectedRole === 'CLIENT' ? 'text-[#2D1B69]' : 'text-slate-300'}`} />
                <span className="text-sm font-black uppercase tracking-wider">Contratante</span>
              </Label>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input {...register('name')} placeholder="Seu nome" className="pl-10 h-12 bg-slate-50 border-none rounded-xl focus-visible:ring-[#2D1B69]" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input {...register('email')} placeholder="seu@email.com" className="pl-10 h-12 bg-slate-50 border-none rounded-xl focus-visible:ring-[#2D1B69]" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input {...register('password')} type="password" placeholder="Mínimo 6 caracteres" className="pl-10 h-12 bg-slate-50 border-none rounded-xl focus-visible:ring-[#2D1B69]" />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-14 bg-[#2D1B69] hover:bg-[#1a1040] text-white text-lg font-black rounded-2xl shadow-xl shadow-purple-100 transition-all"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                Criar Minha Conta
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            Já tem uma conta? <Link to="/login" className="text-[#2D1B69] font-black hover:underline">Fazer Login</Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Register;