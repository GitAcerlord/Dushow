"use client";

import React, { useState } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MapPin, FileText, Loader2, CheckCircle2 } from "lucide-react";
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
  const [formData, setFormData] = useState({
    eventName: "",
    eventDate: "",
    location: "",
    details: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-contract', {
        body: {
          proId: artist.id,
          ...formData
        }
      });

      if (error) {
        const errBody = await error.context?.json();
        throw new Error(errBody?.error || error.message);
      }

      setSuccess(true);
      showSuccess("Proposta enviada com sucesso!");
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({ eventName: "", eventDate: "", location: "", details: "" });
      }, 2000);
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
            <p className="text-slate-500">O artista foi notificado e responderá em breve.</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-2">
                Contratar {artist?.full_name}
              </DialogTitle>
              <DialogDescription>
                Preencha os detalhes do seu evento para enviar a proposta oficial.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Nome do Evento</Label>
                <Input 
                  required
                  placeholder="Ex: Casamento VIP, Sunset Party..." 
                  value={formData.eventName}
                  onChange={(e) => setFormData({...formData, eventName: e.target.value})}
                  className="bg-slate-50 border-none h-12 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Data e Hora</Label>
                  <Input 
                    required
                    type="datetime-local"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                    className="bg-slate-50 border-none h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Localização</Label>
                  <Input 
                    required
                    placeholder="Cidade/Estado"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="bg-slate-50 border-none h-12 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Detalhes Adicionais</Label>
                <Textarea 
                  placeholder="Descreva o cronograma, tempo de show, etc."
                  value={formData.details}
                  onChange={(e) => setFormData({...formData, details: e.target.value})}
                  className="bg-slate-50 border-none rounded-2xl min-h-[100px]"
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl flex justify-between items-center">
                <span className="text-xs font-bold text-blue-700">Cachê Base do Artista:</span>
                <span className="text-lg font-black text-blue-600">R$ {Number(artist?.base_fee).toLocaleString('pt-BR')}</span>
              </div>

              <DialogFooter className="pt-4">
                <Button type="submit" disabled={loading} className="w-full bg-blue-600 h-14 rounded-2xl font-black text-lg shadow-xl shadow-blue-100">
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