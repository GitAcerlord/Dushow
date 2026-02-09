"use client";

import React, { useState } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Lock, Loader2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

interface AddCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddCardDialog = ({ isOpen, onClose, onSuccess }: AddCardDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: ""
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      // Simulação de Tokenização (Em produção, isso seria feito via Stripe.js ou Asaas SDK)
      const last4 = formData.number.slice(-4);
      const [month, year] = formData.expiry.split('/');
      
      const { error } = await supabase.from('payment_methods').insert({
        user_id: user.id,
        brand: 'Mastercard', // Simulado
        last4: last4,
        exp_month: parseInt(month),
        exp_year: parseInt(year),
        gateway_token: `tok_simulated_${Math.random().toString(36).substr(2, 9)}`,
        is_default: false
      });

      if (error) throw error;

      showSuccess("Cartão cadastrado com sucesso!");
      onSuccess();
    } catch (error: any) {
      showError(error.message || "Erro ao salvar cartão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-[2.5rem] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <CreditCard className="text-blue-600" /> Novo Cartão
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleAdd} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400">Número do Cartão</Label>
            <Input 
              placeholder="0000 0000 0000 0000" 
              value={formData.number}
              onChange={(e) => setFormData({...formData, number: e.target.value})}
              className="bg-slate-50 border-none h-12 rounded-xl"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400">Nome no Cartão</Label>
            <Input 
              placeholder="Como impresso no cartão" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="bg-slate-50 border-none h-12 rounded-xl"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">Validade</Label>
              <Input 
                placeholder="MM/AA" 
                value={formData.expiry}
                onChange={(e) => setFormData({...formData, expiry: e.target.value})}
                className="bg-slate-50 border-none h-12 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">CVV</Label>
              <Input 
                placeholder="123" 
                type="password"
                maxLength={3}
                value={formData.cvv}
                onChange={(e) => setFormData({...formData, cvv: e.target.value})}
                className="bg-slate-50 border-none h-12 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-400 justify-center pt-2">
            <Lock className="w-3 h-3" /> Seus dados são criptografados e protegidos.
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={loading} className="w-full bg-blue-600 h-14 rounded-2xl font-black text-lg shadow-xl shadow-blue-100">
              {loading ? <Loader2 className="animate-spin" /> : "Salvar Cartão"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCardDialog;