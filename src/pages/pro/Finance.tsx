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
  Clock,
  ShieldCheck,
  Info,
  TrendingUp
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
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { showSuccess } from "@/utils/toast";

const data = [
  { name: 'Jan', ganhos: 4000 },
  { name: 'Fev', ganhos: 3000 },
  { name: 'Mar', ganhos: 5000 },
  { name: 'Abr', ganhos: 4500 },
  { name: 'Mai', ganhos: 8900 },
  { name: 'Jun', ganhos: 12450 },
];

const transactions = [
  { id: 'TX-901', event: 'Sunset Festival', date: '12/05/2024', gross: 5000, platformFee: 750, asaasFee: 29.90, net: 4220.10, status: 'Disponível' },
  { id: 'TX-882', event: 'Casamento VIP', date: '10/05/2024', gross: 3500, platformFee: 525, asaasFee: 15.50, net: 2959.50, status: 'Em Processamento' },
  { id: 'TX-750', event: 'Aniversário 15 anos', date: '05/05/2024', gross: 2000, platformFee: 300, asaasFee: 8.90, net: 1691.10, status: 'Pago' },
];

const ProFinance = () => {
  const handleWithdraw = () => {
    showSuccess("Solicitação de saque enviada! O valor estará na sua conta em até 24h úteis.");
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Financeiro</h1>
          <p className="text-slate-500 mt-1">Acompanhe seus rendimentos e gerencie seus recebíveis via ASAAS.</p>
        </div>
        <Button variant="outline" className="gap-2 border-slate-200">
          <Download className="w-4 h-4" />
          Exportar Extrato
        </Button>
      </div>

      {/* Balances Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-none shadow-lg bg-indigo-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet size={80} />
          </div>
          <div className="relative z-10">
            <p className="text-indigo-100 text-sm font-medium mb-1">Saldo Disponível (ASAAS)</p>
            <h3 className="text-3xl font-black">R$ 8.925,00</h3>
            <div className="mt-6 flex gap-2">
              <Button onClick={handleWithdraw} className="flex-1 bg-white text-indigo-600 hover:bg-indigo-50 font-bold">
                Solicitar Saque
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+24% este mês</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Total Bruto Acumulado</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">R$ 42.850,00</h3>
          <p className="text-[10px] text-slate-400 mt-2">Desde o início da sua jornada na DUSHOW</p>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">A Liberar (Eventos Futuros)</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">R$ 15.400,00</h3>
          <p className="text-[10px] text-slate-400 mt-2">Valores protegidos em conta Escrow</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Earnings Chart */}
        <Card className="lg:col-span-2 p-6 border-none shadow-sm bg-white">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900">Evolução de Ganhos Líquidos</h3>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-slate-50">6 Meses</Badge>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorGanhos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="ganhos" stroke="#4f46e5" fillOpacity={1} fill="url(#colorGanhos)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Plan Info */}
        <div className="space-y-6">
          <Card className="p-6 border-none shadow-sm bg-slate-900 text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-500 rounded-lg">
                <Percent className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold">Taxas do seu Plano</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-sm text-slate-400">Plano Atual</span>
                <Badge className="bg-indigo-500">SUPERSTAR</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-sm text-slate-500">Comissão DUSHOW</span>
                <span className="font-bold text-emerald-400">10%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-sm text-slate-500">Taxa Gateway (ASAAS)</span>
                <span className="font-bold">Variável</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-4 leading-relaxed">
              Como Superstar, você economiza 50% em taxas comparado ao plano Free.
            </p>
          </Card>

          <Card className="p-6 border-none shadow-sm bg-blue-50 border border-blue-100">
            <div className="flex gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-blue-900">Segurança ASAAS</h4>
                <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                  Seus pagamentos são processados via ASAAS, garantindo conformidade com o Banco Central e segurança total nos repasses.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Detailed Transactions Table */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">Extrato Detalhado</h3>
          <div className="flex gap-2">
            <Badge variant="outline" className="cursor-pointer hover:bg-slate-50">Todos</Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-slate-50">Liquidados</Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-slate-50">Pendentes</Badge>
          </div>
        </div>
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Evento / Data</TableHead>
              <TableHead>Valor Bruto</TableHead>
              <TableHead>Comissão (10%)</TableHead>
              <TableHead>Taxa ASAAS</TableHead>
              <TableHead>Valor Líquido</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{tx.event}</p>
                    <p className="text-[10px] text-slate-400">{tx.date}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm font-medium text-slate-900">
                  R$ {tx.gross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-sm text-red-500">
                  - R$ {tx.platformFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-sm text-orange-600">
                  - R$ {tx.asaasFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-sm font-black text-emerald-600">
                  R$ {tx.net.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    tx.status === 'Disponível' ? 'bg-emerald-50 text-emerald-600' : 
                    tx.status === 'Pago' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
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