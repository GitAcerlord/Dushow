"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Search, Tag, ShieldCheck, Truck, Plus, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const Marketplace = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data } = await supabase.from('marketplace_items').select('*, profiles(full_name)');
    setItems(data || []);
    setLoading(false);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="bg-slate-900 rounded-[2rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-6">
          <Badge className="bg-indigo-600 px-4 py-1">Marketplace Oficial</Badge>
          <h1 className="text-5xl font-black tracking-tight">Equipamentos com Segurança DUSHOW</h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Compre e venda cases, instrumentos e som com nosso intermédio de taxa e garantia de entrega.
          </p>
          <div className="flex gap-4">
            <Button className="bg-white text-slate-900 hover:bg-slate-100 font-bold h-12 px-8 rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Anunciar Produto
            </Button>
            <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800 h-12 px-8 rounded-xl">
              Meus Anúncios
            </Button>
          </div>
        </div>
        <ShoppingBag className="absolute -right-20 -bottom-20 w-96 h-96 text-white/5 rotate-12" />
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input className="pl-10 h-12 bg-white border-slate-200 rounded-xl" placeholder="O que você procura?" />
        </div>
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {['Todos', 'Instrumentos', 'Cases/Malas', 'Som', 'Iluminação', 'LED'].map(cat => (
            <Button key={cat} variant="outline" className="rounded-full text-xs font-bold border-slate-200 whitespace-nowrap">
              {cat}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.length === 0 ? (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag className="text-slate-300 w-10 h-10" />
            </div>
            <p className="text-slate-500 font-medium">Nenhum item anunciado no momento.</p>
          </div>
        ) : (
          items.map((item) => (
            <Card key={item.id} className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all rounded-3xl bg-white">
              <div className="h-48 bg-slate-100 relative">
                <img src={item.image_url || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400'} className="w-full h-full object-cover" />
                <Badge className="absolute top-3 left-3 bg-white/90 text-slate-900 backdrop-blur-sm">{item.category}</Badge>
              </div>
              <div className="p-5 space-y-3">
                <h4 className="font-bold text-slate-900 truncate">{item.title}</h4>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-black">Preço</p>
                    <p className="text-xl font-black text-indigo-600">R$ {Number(item.price).toLocaleString('pt-BR')}</p>
                  </div>
                  <Button size="sm" className="bg-slate-900 rounded-lg">Ver Detalhes</Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Marketplace;