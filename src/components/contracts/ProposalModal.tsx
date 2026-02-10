"use client";

import React, { useState } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MapPin, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  artist: any;
}

const ProposalModal = ({ isOpen, onClose, artist }: ProposalModalProps) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    eventName: "",
    eventDate: "",
    location: "",
    details: ""
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.eventName.trim()) newErrors.eventName = "Dê um nome ao seu evento.";
    if (!formData.eventDate) newErrors.eventDate = "Selecione a data e hora.";
    if (!formData.location.trim()) newErrors.location = "Informe onde será o evento.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Você precisa estar logado para enviar uma proposta.");

      const { data, error } = await supabase.functions.invoke('create-contract', {
        body: {
          proId: artist.id,
          ...formData
        }
      });

      if (error) {
        const errBody = await error.context?.json();
        throw new Error(errBody?.error || "Falha na comunicação com o servidor.");
      }

      setSuccess(true);
      showSuccess("Proposta enviada com sucesso!");
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({ eventName: "", eventDate: "", location: "", details: "" });
      }, 2500);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-[2.5rem] max-w-lg">
        {success ? (
          <div className="py-12 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Proposta Enviada!</h2>
            <p className="text-slate-500">O artista foi notificado e sua proposta já aparece no seu painel.</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-2">
                Contratar {artist?.full_name}
              </DialogTitle>
              <DialogDescription>
                Preencha os detalhes para gerar o contrato digital automático.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Nome do Evento</Label>
                <Input 
                  placeholder="Ex: Casamento VIP, Aniversário..." 
                  value={formData.eventName}
                  onChange={(e) => setFormData({...formData, eventName: e.target.value})}
                  className={`bg-slate-50 border-none h-12 rounded-xl ${errors.eventName ? 'ring-2 ring-red-500' : ''}`}
                />
                {errors.eventName && <p className="text-[10px] text-red-500 font-bold flex items-center gap-1"><AlertCircle size={10} /> {errors.eventName}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Data e Hora</Label>
                  <Input 
                    type="datetime-local"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                    className={`bg-slate-50 border-none h-12 rounded-xl ${errors.eventDate ? 'ring-2 ring-red-500' : ''}`}
                  />
                  {errors.eventDate && <p className="text-[10px] text-red-500 font-bold flex items-center gap-1"><AlertCircle size={10} /> {errors.eventDate}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Localização</Label>
                  <Input 
                    placeholder="Cidade/Estado"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className={`bg-slate-50 border-none h-12 rounded-xl ${errors.location ? 'ring-2 ring-red-500' : ''}`}
                  />
                  {errors.location && <p className="text-[10px] text-red-500 font-bold flex items-center gap-1"><AlertCircle size={10} /> {errors.location}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Detalhes Adicionais</Label>
                <Textarea 
                  placeholder="Descreva o cronograma ou pedidos especiais..."
                  value={formData.details}
                  onChange={(e) => setFormData({...formData, details: e.target.value})}
                  className="bg-slate-50 border-none rounded-2xl min-h-[100px]"
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl flex justify-between items-center border border-blue-100">
                <span className="text-xs font-bold text-blue-700">Cachê Base Sugerido:</span>
                <span className="text-lg font-black text-blue-600">R$ {Number(artist?.base_fee).toLocaleString('pt-BR')}</span>
              </div>

              <DialogFooter className="pt-4">
                <Button type="submit" disabled={loading} className="w-full h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black text-lg shadow-xl shadow-blue-100">
                  {loading ? <Loader2 className="animate-spin" /> : "Enviar Proposta Oficial"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProposalModal;