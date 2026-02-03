"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  CheckCircle2
} from "lucide-react";
import { showSuccess } from "@/utils/toast";

const Checkout = () => {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Dados mockados do contrato
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
    // Simula processamento do gateway ASAAS
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      showSuccess("Pagamento confirmado com sucesso!");
    }, 2500);
  };

  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-8">
        <Card className="max-w-md w-full p-12 text-center space-y-6 border-none shadow-2xl bg-white rounded-3xl animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-slate-900">Show Confirmado!</h2>
          <p className="text-slate-500 leading-relaxed">
            O pagamento foi processado e o artista <strong>{contract.artist}</strong> já foi notificado. Sua data está oficialmente reservada.
          </p>
          <div className="pt-6 space-y-3">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl font-bold" onClick={() => navigate('/client/events')}>
              Ver Meus Eventos
            </Button>
            <Button variant="ghost" className="w-full text-slate-400" onClick={() => navigate('/client/discovery')}>
              Voltar para a Busca
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para a Busca
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: Payment Methods */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Finalizar Contratação</h1>
            <p className="text-slate-500 mt-2">Escolha como deseja realizar o pagamento do cachê.</p>
          </div>
          
          <Card className="p-8 border-none shadow-sm bg-white rounded-3xl">
            <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <CreditCard className="w-5 h-5 text-indigo-600" />
              </div>
              Método de Pagamento
            </h3>

            <RadioGroup defaultValue="card" onValueChange={setPaymentMethod} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <Label
                htmlFor="card"
                className={`flex flex-col items-center justify-center p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${
                  paymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50/50 shadow-md' : 'border-slate-100 hover:bg-slate-50'
                }`}
              >
                <RadioGroupItem value="card" id="card" className="sr-only" />
                <CreditCard className={`w-8 h-8 mb-3 ${paymentMethod === 'card' ? 'text-indigo-600' : 'text-slate-300'}`} />
                <span className="text-sm font-black uppercase tracking-wider">Cartão</span>
              </Label>

              <Label
                htmlFor="pix"
                className={`flex flex-col items-center justify-center p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${
                  paymentMethod === 'pix' ? 'border-indigo-600 bg-indigo-50/50 shadow-md' : 'border-slate-100 hover:bg-slate-50'
                }`}
              >
                <RadioGroupItem value="pix" id="pix" className="sr-only" />
                <QrCode className={`w-8 h-8 mb-3 ${paymentMethod === 'pix' ? 'text-indigo-600' : 'text-slate-300'}`} />
                <span className="text-sm font-black uppercase tracking-wider">PIX</span>
              </Label>

              <Label
                htmlFor="boleto"
                className={`flex flex-col items-center justify-center p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${
                  paymentMethod === 'boleto' ? 'border-indigo-600 bg-indigo-50/50 shadow-md' : 'border-slate-100 hover:bg-slate-50'
                }`}
              >
                <RadioGroupItem value="boleto" id="boleto" className="sr-only" />
                <FileText className={`w-8 h-8 mb-3 ${paymentMethod === 'boleto' ? 'text-indigo-600' : 'text-slate-300'}`} />
                <span className="text-sm font-black uppercase tracking-wider">Boleto</span>
              </Label>
            </RadioGroup>

            {paymentMethod === 'card' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-400 uppercase">Número do Cartão</Label>
                    <Input placeholder="0000 0000 0000 0000" className="h-12 bg-slate-50 border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-400 uppercase">Nome no Cartão</Label>
                    <Input placeholder="Como impresso no cartão" className="h-12 bg-slate-50 border-none rounded-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-2 space-y-2">
                    <Label className="text-xs font-bold text-slate-400 uppercase">Validade</Label>
                    <Input placeholder="MM/AA" className="h-12 bg-slate-50 border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-400 uppercase">CVV</Label>
                    <Input placeholder="123" className="h-12 bg-slate-50 border-none rounded-xl" />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'pix' && (
              <div className="text-center p-10 bg-slate-50 rounded-3xl space-y-6 animate-in fade-in duration-500">
                <div className="w-40 h-40 bg-white p-4 mx-auto rounded-2xl shadow-sm border border-slate-100">
                  <QrCode className="w-full h-full text-slate-900" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">QR Code Dinâmico</p>
                  <p className="text-xs text-slate-500 mt-1">O código será gerado instantaneamente após a confirmação.</p>
                </div>
              </div>
            )}

            {paymentMethod === 'boleto' && (
              <div className="p-8 bg-blue-50 rounded-3xl flex items-start gap-4 animate-in fade-in duration-500 border border-blue-100">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Info className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-900">Informação Importante</p>
                  <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                    Boletos levam até 3 dias úteis para compensar. A reserva da data só é garantida após a confirmação do banco.
                  </p>
                </div>
              </div>
            )}
          </Card>

          <div className="flex items-center gap-4 p-6 bg-emerald-50 border border-emerald-100 rounded-3xl">
            <div className="p-3 bg-white rounded-2xl shadow-sm">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-black text-emerald-900 uppercase tracking-wider">Pagamento Protegido (Escrow)</p>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Seu dinheiro fica retido com segurança pela DUSHOW e só é liberado para o artista 48h após a realização do evento.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="space-y-6">
          <Card className="p-8 border-none shadow-xl bg-white sticky top-24 rounded-3xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
            <h3 className="text-xl font-bold text-slate-900 mb-8">Resumo do Contrato</h3>
            
            <div className="space-y-6 mb-8">
              <div className="flex gap-4 items-center">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border-2 border-white shadow-md">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alok" alt="Artist" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-black text-slate-900 text-lg">{contract.artist}</p>
                  <Badge className="bg-indigo-50 text-indigo-600 border-none text-[10px] font-bold uppercase">{contract.event}</Badge>
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-50">
                <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                  <div className="p-1.5 bg-slate-50 rounded-lg"><Calendar className="w-4 h-4 text-indigo-500" /></div>
                  {contract.date}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                  <div className="p-1.5 bg-slate-50 rounded-lg"><MapPin className="w-4 h-4 text-indigo-500" /></div>
                  {contract.location}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-50">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-medium">Cachê do Artista</span>
                <span className="font-bold text-slate-900">R$ {contract.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-medium">Taxa de Serviço (ASAAS)</span>
                <span className="font-bold text-slate-900">R$ {contract.serviceFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-end pt-4 border-t border-slate-100">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total a Pagar</p>
                  <p className="text-3xl font-black text-indigo-600">R$ {(contract.value + contract.serviceFee).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full h-16 mt-10 bg-indigo-600 hover:bg-indigo-700 text-lg font-black rounded-2xl shadow-2xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isProcessing ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processando...
                </div>
              ) : (
                <>
                  Confirmar Pagamento
                  <Lock className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>

            <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
              <ShieldCheck className="w-3 h-3" />
              Ambiente 100% Seguro via ASAAS
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;