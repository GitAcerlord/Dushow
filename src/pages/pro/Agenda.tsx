"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  MapPin, 
  Lock, 
  Loader2, 
  Trash2 
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from "@/lib/utils";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval 
} from "date-fns";
import { ptBR } from "date-fns/locale";

const ProAgenda = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [newBlock, setNewBlock] = useState({ start_date: "", end_date: "", reason: "" });

  useEffect(() => {
    fetchAgenda();
  }, [currentMonth]);

  const fetchAgenda = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: contracts } = await supabase
      .from('contracts')
      .select('*')
      .eq('profissional_profile_id', user.id)
      .in('status', ['AGUARDANDO_PAGAMENTO', 'PAGO_ESCROW', 'EM_EXECUCAO']);

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
        start_date: new Date(newBlock.start_date).toISOString(),
        end_date: new Date(newBlock.end_date).toISOString(),
        reason: newBlock.reason
      });
      if (error) throw error;
      showSuccess("Período bloqueado com sucesso.");
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

  // Lógica do Calendário
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#2D1B69]">Minha Agenda</h1>
          <p className="text-slate-500">Gestão visual de shows e disponibilidade.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddingBlock(true)} className="bg-[#2D1B69] rounded-xl gap-2 h-12 shadow-lg shadow-purple-100">
            <Plus className="w-4 h-4" /> Bloquear Data
          </Button>
        </div>
      </div>

      {isAddingBlock && (
        <Card className="p-6 border-2 border-indigo-100 bg-indigo-50/30 rounded-[2rem] animate-in fade-in slide-in-from-top-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase">Início</Label>
              <Input type="date" value={newBlock.start_date} onChange={(e) => setNewBlock({...newBlock, start_date: e.target.value})} className="bg-white border-none rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase">Fim</Label>
              <Input type="date" value={newBlock.end_date} onChange={(e) => setNewBlock({...newBlock, end_date: e.target.value})} className="bg-white border-none rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase">Motivo</Label>
              <Input placeholder="Férias, Show Externo..." value={newBlock.reason} onChange={(e) => setNewBlock({...newBlock, reason: e.target.value})} className="bg-white border-none rounded-xl" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setIsAddingBlock(false)}>Cancelar</Button>
            <Button onClick={handleAddBlock} className="bg-[#2D1B69] rounded-xl">Confirmar</Button>
          </div>
        </Card>
      )}

      {/* Header do Calendário */}
      <Card className="p-6 border-none shadow-xl bg-white rounded-[2.5rem]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-[#2D1B69] uppercase tracking-tight">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft /></Button>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight /></Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="bg-slate-50 p-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
              {day}
            </div>
          ))}
          {calendarDays.map((day, i) => {
            const dayEvents = events.filter(e => isSameDay(new Date(e.data_evento), day));
            const dayBlocks = blocks.filter(b => isSameDay(new Date(b.start_date), day));
            const isToday = isSameDay(day, new Date());

            return (
              <div 
                key={i} 
                className={cn(
                  "min-h-[120px] p-2 bg-white transition-all hover:bg-slate-50 relative",
                  !isSameMonth(day, monthStart) && "bg-slate-50/50 text-slate-300",
                  isToday && "ring-2 ring-inset ring-indigo-100 bg-indigo-50/10"
                )}
              >
                <span className={cn(
                  "text-xs font-bold p-1 rounded-md",
                  isToday ? "bg-[#2D1B69] text-white" : "text-slate-500"
                )}>
                  {format(day, 'd')}
                </span>

                <div className="mt-2 space-y-1">
                  {dayEvents.map(e => (
                    <div key={e.id} className="p-1.5 bg-[#2D1B69] text-white text-[9px] rounded-md font-bold truncate flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-[#FFB703]" />
                      {e.event_name}
                    </div>
                  ))}
                  {dayBlocks.map(b => (
                    <div key={b.id} className="p-1.5 bg-slate-100 text-slate-500 text-[9px] rounded-md font-bold truncate flex items-center gap-1 border border-slate-200">
                      <Lock className="w-2 h-2" />
                      {b.reason || "Indisponível"}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default ProAgenda;
