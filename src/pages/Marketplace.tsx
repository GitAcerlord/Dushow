"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Tag, ShieldCheck, Truck } from 'lucide-react';

const Marketplace = () => {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="bg-slate-900 rounded-3xl p-12 text-white relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-6">
          <Badge className="bg-indigo-600">Em Breve</Badge>
          <h1 className="text-5xl font-black">Marketplace DUSHOW</h1>
          <p className="text-slate-400 text-lg">
            O maior mercado de equipamentos para eventos. Compre e venda cases, instrumentos e som com a segurança do nosso contrato.
          </p>
          <Button className="bg-white text-slate-900 hover:bg-slate-100 font-bold h-12 px-8 rounded-xl">Quero Anunciar</Button>
        </div>
        <ShoppingBag className="absolute -right-20 -bottom-20 w-96 h-96 text-white/5 rotate-12" />
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <Card className="p-8 border-none shadow-sm bg-white space-y-4">
          <ShieldCheck className="w-10 h-10 text-indigo-600" />
          <h3 className="font-bold text-xl">Compra Segura</h3>
          <p className="text-sm text-slate-500">Intermédio de taxa DUSHOW garantindo que o produto chegue como anunciado.</p>
        </Card>
        <Card className="p-8 border-none shadow-sm bg-white space-y-4">
          <Tag className="w-10 h-10 text-emerald-600" />
          <h3 className="font-bold text-xl">Descontos Exclusivos</h3>
          <p className="text-sm text-slate-500">Membros Pro e Elite ganham cupons em lojas parceiras como ATM Distribuição.</p>
        </Card>
        <Card className="p-8 border-none shadow-sm bg-white space-y-4">
          <Truck className="w-10 h-10 text-amber-600" />
          <h3 className="font-bold text-xl">Logística Integrada</h3>
          <p className="text-sm text-slate-500">Facilidade no envio de equipamentos pesados e sensíveis.</p>
        </Card>
      </div>
    </div>
  );
};

export default Marketplace;