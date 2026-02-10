"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, Clock, MapPin, Loader2, Plus, Trash2, AlertCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

const ProAgenda = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [newBlock, setNewBlock] = useState({ start_date: "", end_date: "", reason: "" });

  useEffect(() => {
    fetchAgenda();
  }, []);

  const fetchAgenda = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Contratos
    const { data: contracts } = await supabase
      .from('contracts')
      .select('*')
      .eq('profissional_profile_id', user.id)
      .in('status', ['ASSINADO', 'PAGO', 'COMPLETED']);

    // 2. Bloqueios Manuais
    const { data: manualBlocks } = await supabase
      .from('availability_blocks')
      .select('*')
      .eq('profile_id', user.id);

    setEvents(contracts || []);
    setBlocks(manualBlocks || []);
    setLoading(false);
  };

  const handleAddBlock = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('availability_blocks').insert({
        profile_id: user?.id,
        ...newBlock
      });
      if (error) throw error;
      showSuccess("Data bloqueada na sua agenda.");
      setIsAddingBlock(false);
      fetchAgenda();
    } catch (e: any) {
      showError(e.message);
    }
  };

  const deleteBlock = async (id: string) => {
    await supabase.from('availability_blocks').delete().eq('id', id);
    setBlocks(blocks.filter(b => b.id !== id));
    showSuccess("Bloqueio removido.");
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Minha Agenda</h1>
          <p className="text-slate-500">Gerencie seus shows e sua disponibilidade.</p>
        </div>
        <Button onClick={() => setIsAddingBlock(true)} className="bg-indigo-600 rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Bloquear Data
        </Button>
      </div>

      {isAddingBlock && (
        <Card className="p-6 border-2 border-indigo-100 bg-indigo-50/30 rounded-[2rem] animate-in fade-in slide-in-from-top-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase">Início</Label>
              <Input type="datetime-local" value={newBlock.start_date} onChange={(e) => setNewBlock({...newBlock, start_date: e.target.value})} className="bg-white border-none rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase">Fim</Label>
              <Input type="datetime-local" value={newBlock.end_date} onChange={(e) => setNewBlock({...newBlock, end_date: e.target.value})} className="bg-white border-none rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase">Motivo</Label>
              <Input placeholder="Ex: Férias, Show Externo" value={newBlock.reason} onChange={(e) => setNewBlock({...newBlock, reason: e.target.value})} className="bg-white border-none rounded-xl" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setIsAddingBlock(false)}>Cancelar</Button>
            <Button onClick={handleAddBlock} className="bg-indigo-600 rounded-xl">Confirmar Bloqueio</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="font-black text-slate-900 flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-indigo-600" /> Shows Confirmados</h3>
          {events.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Nenhum show assinado no momento.</p>
          ) : (
            events.map(event => (
              <Card key={event.id} className="p-4 border-none shadow-sm bg-white flex gap-4 items-center rounded-2xl">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex flex-col items-center justify-center text-indigo-600">
                  <span className="text-lg font-black leading-none">{new Date(event.data_evento).getDate()}</span>
                  <span className="text-[8px] uppercase font-bold">{new Date(event.data_evento).toLocaleString('pt-BR', { month: 'short' })}</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-900">{event.event_name}</h4>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.event_location}</p>
                </div>
                <Badge className="bg-emerald-500 text-white text-[8px]">{event.status}</Badge>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-black text-slate-900 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-amber-500" /> Datas Bloqueadas</h3>
          {blocks.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Sua agenda está totalmente livre.</p>
          ) : (
            blocks.map(block => (
              <Card key={block.id} className="p-4 border-none shadow-sm bg-slate-50 flex gap-4 items-center rounded-2xl">
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-700">{block.reason || "Indisponível"}</h4>
                  <p className="text-[10px] text-slate-400">
                    {new Date(block.start_date).toLocaleDateString()} até {new Date(block.end_date).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteBlock(block.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProAgenda;