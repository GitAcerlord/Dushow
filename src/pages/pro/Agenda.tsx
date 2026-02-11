"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Clock, MapPin, Loader2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

const ProAgenda = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // QUERY SSOT: Apenas status válidos para agenda
      const { data } = await supabase
        .from('contracts')
        .select('*, profiles!contracts_client_id_fkey(full_name, avatar_url)')
        .eq('pro_id', user.id)
        .in('status', ['ACCEPTED', 'SIGNED', 'COMPLETED'])
        .order('event_date', { ascending: true });

      setEvents(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const eventsByDay = useMemo(() => {
    return events.reduce((acc, event) => {
      const key = new Date(event.event_date).toISOString().split('T')[0];
      if (!acc[key]) acc[key] = [];
      acc[key].push(event);
      return acc;
    }, {} as Record<string, any[]>);
  }, [events]);

  const selectedDayKey = selectedDate ? selectedDate.toISOString().split('T')[0] : '';
  const selectedDayEvents = selectedDayKey ? (eventsByDay[selectedDayKey] || []) : [];

  const eventDays = useMemo(
    () => Object.keys(eventsByDay).map((dateKey) => new Date(`${dateKey}T00:00:00`)),
    [eventsByDay],
  );

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Minha Agenda</h1>
        <p className="text-slate-500">Visual moderno com calendário e compromissos por dia.</p>
      </div>

      {loading ? <div className="flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div> : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <Card className="lg:col-span-2 p-4 md:p-6 border-none shadow-sm bg-white rounded-[2rem]">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={{ hasEvent: eventDays }}
              modifiersClassNames={{
                hasEvent: "bg-indigo-100 text-indigo-700 font-bold rounded-md",
              }}
              className="w-full"
            />
          </Card>

          <div className="lg:col-span-3 space-y-4">
            {selectedDayEvents.length === 0 ? (
              <Card className="p-12 text-center text-slate-400 font-medium border-dashed border-2 rounded-[2rem]">
                Nenhum show confirmado para este dia.
              </Card>
            ) : (
              selectedDayEvents.map((event) => (
                <Card key={event.id} className="p-6 border-none shadow-sm bg-white flex gap-4 items-center rounded-[2rem]">
                  <Avatar className="w-14 h-14 border-2 border-white shadow-sm">
                    <AvatarImage src={event.profiles?.avatar_url} />
                    <AvatarFallback>{event.profiles?.full_name?.[0] || 'C'}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-900">{event.event_name}</h4>
                      <Badge className={event.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}>
                        {event.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mt-1 font-medium">Contratante: {event.profiles?.full_name || 'Não informado'}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.event_location}</span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProAgenda;
