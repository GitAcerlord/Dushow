"use client";

import React, { useState } from 'react';
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
  CheckCircle2
} from "lucide-react";
import { showSuccess } from "@/utils/toast";

const Checkout = () => {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);

  // Dados mockados do contrato (em um app real viriam via state ou URL)
  const contract = {
    artist: "DJ Alok",
    event: "Sunset Party",
    date: "25 de Maio, 2024",
    location: "Búzios, RJ",
    value: 15000.00,
    serviceFee: 225.00 // Taxa de processamento ASAAS
  };

  const handlePayment = () => {
    setIsProcessing(true);
    // Simula processamento do gateway
    setTimeout(() => {
      setIsProcessing(false);
      showSuccess("Pagamento confirmado! O artista foi notificado e sua data está reservada.");
      navigate('/client/events');
    }, 2000);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Payment Methods */}
        <div className="lg:col-span-2 space-y-6">
          <h1 className="text-3xl font-bold text-slate-900">Finalizar Contratação</h1>
          
          <Card className="p-6 border-none shadow-sm bg-white">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              Forma de Pagamento
            </h3>

            <RadioGroup defaultValue="card" onValueChange={setPaymentMethod} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Label
                htmlFor="card"
                className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  paymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:bg-slate-50'
                }`}
              >
                <RadioGroupItem value="card" id="card" className="sr-only" />
                <CreditCard className={`w-6 h-6 mb-2 ${paymentMethod === 'card' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-sm font-bold">Cartão</span>
              </Label>

              <Label
                htmlFor="pix"
                className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  paymentMethod === 'pix' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:bg-slate-50'
                }`}
              >
                <RadioGroupItem value="pix" id="pix" className="sr-only" />
                <QrCode className={`w-6 h-6 mb-2 ${paymentMethod === 'pix' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-sm font-bold">PIX</span>
              </Label>

              <Label
                htmlFor="boleto"
                className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  paymentMethod === 'boleto' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:bg-slate-50'
                }`}
              >
                <RadioGroupItem value="boleto" id="boleto" className="sr-only" />
                <FileText className={`w-6 h-6 mb-2 ${paymentMethod === 'boleto' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-sm font-bold">Boleto</span>
              </Label>
            </RadioGroup>

            {paymentMethod === 'card' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Número do Cartão</Label>
                    <Input placeholder="0000 0000 0000 0000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome no Cartão</Label>
                    <Input placeholder="Como impresso no cartão" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Validade</Label>
                    <Input placeholder="MM/AA" />
                  </div>
                  <div className="space-y-2">
                    <Label>CVV</Label>
                    <Input placeholder="123" />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'pix' && (
              <div className="text-center p-8 bg-slate-50 rounded-2xl space-y-4 animate-in fade-in">
                <div className="w-32 h-32 bg-white p-2 mx-auto rounded-xl shadow-sm">
                  <QrCode className="w-full h-full text-slate-900" />
                </div>
                <p className="text-sm text-slate-500">O QR Code será gerado após clicar em "Finalizar Pagamento".</p>
              </div>
            )}

            {paymentMethod === 'boleto' && (
              <div className="p-6 bg-blue-50 rounded-2xl flex items-start gap-4 animate-in fade-in">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  O boleto tem prazo de compensação de até 3 dias úteis. A data do show só será reservada após a confirmação bancária.
                </p>
              </div>
            )}
          </Card>

          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <div>
              <p className="text-sm font-bold text-emerald-900">Pagamento Protegido</p>
              <p className="text-xs text-emerald-700">Seu dinheiro fica seguro com a DUSHOW até a realização do evento.</p>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="space-y-6">
          <Card className="p-6 border-none shadow-sm bg-white sticky top-24">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Resumo do Pedido</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alok" alt="Artist" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{contract.artist}</p>
                  <p className="text-xs text-indigo-600 font-medium">{contract.event}</p>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="w-4 h-4" />
                  {contract.date}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="w-4 h-4" />
                  {contract.location}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Cachê Artista</span>
                <span className="font-medium text-slate-900">R$ {contract.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Taxa de Serviço (ASAAS)</span>
                <span className="font-medium text-slate-900">R$ {contract.serviceFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-3 border-t">
                <span className="text-slate-900">Total</span>
                <span className="text-indigo-600">R$ {(contract.value + contract.serviceFee).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <Button 
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full h-14 mt-8 bg-indigo-600 hover:bg-indigo-700 text-lg font-bold rounded-xl shadow-lg shadow-indigo-200"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processando...
                </div>
              ) : (
                <>
                  Finalizar Pagamento
                  <Lock className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>

            <p className="text-[10px] text-center text-slate-400 mt-4">
              Ao clicar em finalizar, você concorda com os Termos de Uso e a Política de Cancelamento da DUSHOW.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

import { Info } from 'lucide-react';
export default Checkout;