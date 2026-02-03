"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download,
  Wallet,
  Percent,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

const transactions = [
  { id: 'TX-901', event: 'Sunset Festival', date: '12/05/2024', gross: 5000, fee: 750, net: 4250, status: 'Disponível' },
  { id: 'TX-882', event: 'Casamento VIP', date: '10/05/2024', gross: 3500, fee: 525, net: 2975, status: 'Em Processamento' },
  { id: 'TX-750', event: 'Aniversário 15 anos', date: '05/05/2024', gross: 2000, fee: 300, net: 1700, status: 'Pago' },
];

const ProFinance = () => {
  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Financeiro</h1>
          <p className="text-slate-500 mt-1">Gerencie seus cachês e acompanhe as comissões da plataforma.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Download className="w-4 h-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-none shadow-sm bg-indigo-600 text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-white/10 rounded-lg">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">Saldo ASAAS</span>
          </div>
          <p className="text-indigo-100 text-sm font-medium">Disponível para Saque</p>
          <h3 className="text-3xl font-bold mt-1">R$ 8.925,00</h3>
          <Button variant="secondary" className="w-full mt-6 bg-white text-indigo-600 hover:bg-indigo-50">
            Solicitar Transferência
          </Button>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <ArrowUpRight className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Total Bruto (Mês)</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">R$ 10.500,00</h3>
          <p className="text-xs text-emerald-600 mt-2 font-medium">+15% em relação ao mês anterior</p>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Percent className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Comissões DUSHOW (15%)</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">R$ 1.575,00</h3>
          <p className="text-xs text-slate-400 mt-2">Taxa fixa do plano atual</p>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold text-slate-900">Extrato de Vendas</h3>
        </div>
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Valor Bruto</TableHead>
              <TableHead>Comissão (15%)</TableHead>
              <TableHead>Valor Líquido</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="font-medium text-slate-900">{tx.event}</TableCell>
                <TableCell className="text-slate-500">{tx.date}</TableCell>
                <TableCell className="text-slate-900">R$ {tx.gross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-red-500">- R$ {tx.fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                <TableCell className="font-bold text-emerald-600">R$ {tx.net.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    tx.status === 'Disponível' ? 'bg-emerald-50 text-emerald-600' : 
                    tx.status === 'Pago' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {tx.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default ProFinance;