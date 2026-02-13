"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, MapPin, FileText, Loader2, Filter, Plus, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

const ClientEvents = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: "", eventDate: "", location: "" });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("client_events_summary")
        .select("*")
        .eq("contratante_profile_id", user.id);

      if (startDate) query = query.gte("event_date", new Date(startDate).toISOString());
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte("event_date", end.toISOString());
      }

      const { data, error } = await query.order("event_date", { ascending: true });
      if (error) throw error;
      setEvents(data || []);
    } catch {
      showError("Falha ao carregar eventos.");
    } finally {
      setLoading(false);
    }
  };

  const createManualEvent = async () => {
    if (!newEvent.name || !newEvent.eventDate || !newEvent.location) {
      showError("Preencha nome, data e local.");
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-client-event", {
        body: newEvent,
      });
      if (error) throw error;
      showSuccess("Evento criado em planejamento.");
      setOpenCreate(false);
      setNewEvent({ name: "", eventDate: "", location: "" });
      fetchEvents();
    } catch (e: any) {
      showError(e.message || "Falha ao criar evento.");
    } finally {
      setCreating(false);
    }
  };

  if (loading && events.length === 0) {
    return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Meus Eventos</h1>
          <p className="text-slate-500">Evento e um conjunto de contratos com status consolidado.</p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 h-10 rounded-xl font-bold"><Plus className="w-4 h-4 mr-2" /> Novo Evento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Evento Manual</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Nome do evento" value={newEvent.name} onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })} />
                <Input type="datetime-local" value={newEvent.eventDate} onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })} />
                <Input placeholder="Local" value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} />
                <Button onClick={createManualEvent} disabled={creating} className="w-full">
                  {creating ? <Loader2 className="animate-spin" /> : "Criar Evento"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="p-4 border-none shadow-sm bg-white flex flex-wrap items-center gap-4 rounded-2xl w-full">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-400 uppercase">Filtrar Data:</span>
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 text-xs bg-slate-50 border-none rounded-lg w-32" />
          <span className="text-slate-300">ate</span>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 text-xs bg-slate-50 border-none rounded-lg w-32" />
        </div>
        <Button onClick={fetchEvents} size="sm" className="bg-blue-600 h-9 rounded-lg px-4 font-bold">Aplicar</Button>
      </Card>

      <div className="grid gap-6">
        {events.length === 0 ? (
          <Card className="p-20 text-center space-y-4 border-dashed border-2 rounded-[3rem] bg-slate-50/50">
            <Calendar className="w-16 h-16 text-slate-200 mx-auto" />
            <p className="text-slate-900 font-black text-xl">Nenhum evento encontrado</p>
            <Button asChild className="bg-blue-600 rounded-xl px-8 h-12 font-bold">
              <Link to="/app/discovery">Explorar Artistas</Link>
            </Button>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id} className="p-6 border-none shadow-sm bg-white flex flex-col md:flex-row gap-6 items-center rounded-[2.5rem] hover:shadow-md transition-all">
              <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex flex-col items-center justify-center text-blue-600 shrink-0">
                <span className="text-3xl font-black leading-none">{new Date(event.event_date).getDate()}</span>
                <span className="text-[10px] uppercase font-black">{new Date(event.event_date).toLocaleString("pt-BR", { month: "short" })}</span>
              </div>

              <div className="flex-1 space-y-3 w-full">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-900">{event.name}</h3>
                  <Badge className="uppercase text-[10px] font-black px-4 py-1.5 rounded-full">{event.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-blue-400" /> {event.location}</span>
                  <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-blue-400" /> {event.total_contracts} profissionais</span>
                  <span className="font-black text-slate-900">R$ {Number(event.total_value).toLocaleString("pt-BR")}</span>
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <Button variant="outline" asChild className="rounded-xl gap-2 border-slate-200 text-slate-600 flex-1 md:flex-none font-bold">
                  <Link to={`/app/discovery`}><FileText className="w-4 h-4" /> Adicionar Profissional</Link>
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ClientEvents;
