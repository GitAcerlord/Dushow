"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

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
    cvv: "",
    cpfCnpj: "",
    postalCode: "",
    addressNumber: "",
    phone: "",
  });

  const luhnCheck = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    let sum = 0;
    let shouldDouble = false;
    for (let i = digits.length - 1; i >= 0; i -= 1) {
      let digit = Number(digits[i]);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return digits.length >= 13 && sum % 10 === 0;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!luhnCheck(formData.number)) throw new Error("Numero de cartao invalido.");
      if (!formData.expiry.includes("/")) throw new Error("Validade invalida. Use MM/AA.");
      if (String(formData.cvv).replace(/\D/g, "").length < 3) throw new Error("CVV invalido.");
      if (String(formData.cpfCnpj).replace(/\D/g, "").length < 11) throw new Error("CPF/CNPJ invalido.");

      const { data, error } = await supabase.functions.invoke("tokenize-card", {
        body: {
          number: formData.number,
          name: formData.name,
          expiry: formData.expiry,
          cvv: formData.cvv,
          cpfCnpj: formData.cpfCnpj,
          postalCode: formData.postalCode,
          addressNumber: formData.addressNumber,
          phone: formData.phone,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error("Falha ao tokenizar cartao.");

      showSuccess("Cartao cadastrado com sucesso!");
      onSuccess();
    } catch (error: any) {
      showError(error.message || "Erro ao salvar cartao.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-[2.5rem] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <CreditCard className="text-blue-600" /> Novo Cartao
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleAdd} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400">Numero do Cartao</Label>
            <Input
              placeholder="0000 0000 0000 0000"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              className="bg-slate-50 border-none h-12 rounded-xl"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400">Nome no Cartao</Label>
            <Input
              placeholder="Como impresso no cartao"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                className="bg-slate-50 border-none h-12 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">CVV</Label>
              <Input
                placeholder="123"
                type="password"
                maxLength={4}
                value={formData.cvv}
                onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                className="bg-slate-50 border-none h-12 rounded-xl"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">CPF/CNPJ</Label>
              <Input
                placeholder="Somente numeros"
                value={formData.cpfCnpj}
                onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                className="bg-slate-50 border-none h-12 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">Telefone</Label>
              <Input
                placeholder="DDD + numero"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-slate-50 border-none h-12 rounded-xl"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">CEP</Label>
              <Input
                placeholder="Somente numeros"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="bg-slate-50 border-none h-12 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">Numero</Label>
              <Input
                placeholder="Numero do endereco"
                value={formData.addressNumber}
                onChange={(e) => setFormData({ ...formData, addressNumber: e.target.value })}
                className="bg-slate-50 border-none h-12 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-400 justify-center pt-2">
            <Lock className="w-3 h-3" /> Seus dados sao tokenizados no Asaas.
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={loading} className="w-full bg-blue-600 h-14 rounded-2xl font-black text-lg shadow-xl shadow-blue-100">
              {loading ? <Loader2 className="animate-spin" /> : "Salvar Cartao"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCardDialog;
