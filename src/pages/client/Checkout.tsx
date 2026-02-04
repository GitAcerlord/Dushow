"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  ShieldCheck, 
  CreditCard, 
  QrCode, 
  FileText, 
  Calendar, 
  MapPin, 
  ArrowLeft,
  Lock,
  Info,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from "@/utils/toast";

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Dados do artista passados via navegação ou mockados para teste
  const artist = location.state?.artist || {
    id: 'mock-id',
    full_name: "DJ Alok",
    price: 15000.00
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handlePayment = async () => {
    if (!user) {
      showError("Você precisa estar logado para contratar.");
      return;
    }

    setIsProcessing(true);
    
    try {
      // 1. Simula processamento ASAAS
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 2. Salva o contrato no banco
      const { error } = await supabase
        .from('contracts')
        .insert({
          client_id: user.id,
          pro_id: artist.id,
          event_name: `Show com ${artist.full_name}`,
          event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias a frente
          event_location: "Local a definir",
          value: artist.price,
          status: 'PAID'
        });

      if (error) throw error;

      setIsSuccess(true);
      showSuccess("Pagamento confirmado e contrato gerado!");
    } catch (error: any) {
      showError(error.message || "Erro ao processar pagamento.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-8">
        <Card className="max-w-md w-full p-12 text-center space-y-6 border-none shadow-2xl bg-white rounded-3xl">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-slate-900">Show Confirmado!</h2>
          <p className="text-slate-500 leading-relaxed">
            O contrato foi gerado com sucesso. O artista já pode visualizar o evento na agenda dele.
          </p>
          <Button className="w-full bg-indigo-600 h-12 rounded-xl font-bold" onClick={() => navigate('/client/discovery')}>
            Voltar para a Busca
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 font-bold text-sm">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <h1 className="text-4xl font-black text-slate-900">Finalizar Contratação</h1>
          
          <Card className="p-8 border-none shadow-sm bg-white rounded-3xl">
            <RadioGroup defaultValue="card" onValueChange={setPaymentMethod} className="grid grid-cols-3 gap-4 mb-8">
              <Label htmlFor="card" className={`p-6 border-2 rounded-2xl cursor-pointer text-center ${paymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}>
                <RadioGroupItem value="card" id="card" className="sr-only" />
                <CreditCard className="w-8 h-8 mx-auto mb-2" />
                <span className="text-xs font-bold uppercase">Cartão</span>
              </Label>
              <Label htmlFor="pix" className={`p-6 border-2 rounded-2xl cursor-pointer text-center ${paymentMethod === 'pix' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}>
                <RadioGroupItem value="pix" id="pix" className="sr-only" />
                <QrCode className="w-8 h-8 mx-auto mb-2" />
                <span className="text-xs font-bold uppercase">PIX</span>
              </Label>
              <Label htmlFor="boleto" className={`p-6 border-2 rounded-2xl cursor-pointer text-center ${paymentMethod === 'boleto' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}>
                <RadioGroupItem value="boleto" id="boleto" className="sr-only" />
                <FileText className="w-8 h-8 mx-auto mb-2" />
                <span className="text-xs font-bold uppercase">Boleto</span>
              </Label>
            </RadioGroup>

            <div className="space-y-4">
              <Input placeholder="Número do Cartão" className="h-12 bg-slate-50 border-none" />
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Validade" className="h-12 bg-slate-50 border-none" />
                <Input placeholder="CVV" className="h-12 bg-slate-50 border-none" />
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-8 border-none shadow-xl bg-white rounded-3xl h-fit">
          <h3 className="text-xl font-bold mb-6">Resumo</h3>
          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Artista</span>
              <span className="font-bold">{artist.full_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Cachê</span>
              <span className="font-bold">R$ {Number(artist.price).toLocaleString('pt-BR')}</span>
            </div>
            <div className="pt-4 border-t flex justify-between items-end">
              <span className="text-xs font-bold uppercase text-slate-400">Total</span>
              <span className="text-2xl font-black text-indigo-600">R$ {Number(artist.price).toLocaleString('pt-BR')}</span>
            </div>
          </div>
          <Button 
            onClick={handlePayment} 
            disabled={isProcessing}
            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 font-black rounded-xl"
          >
            {isProcessing ? <Loader2 className="animate-spin" /> : "Confirmar Pagamento"}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Checkout;