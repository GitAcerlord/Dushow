"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  ArrowUpRight, 
  Download,
  Wallet,
  Percent,
  ArrowRightLeft,
  PieChart as PieChartIcon
} from "lucide-react";
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
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const data = [
  { name: 'Jan', receita: 45000, comissao: 6750 },
  { name: 'Fev', receita: 52000, comissao: 7800 },
  { name: 'Mar', receita: 48000, comissao: 7200 },
  { name: 'Abr', receita: 61000, comissao: 9150 },
  { name: 'Mai', receita: 55000, comissao: 8250 },
  { name: 'Jun', receita: 67000, comissao: 10050 },
];

const transactions = [
  { id: 'TX-1024', event: 'Sunset Party', gross: 15000, asaasFee: 29.90, platformFee: 2250, artistNet: 12720.10, status: 'Liquidado' },
  { id: 'TX-1025', event: 'Casamento VIP', gross: 4500, asaasFee: 15.50, platformFee: 675, artistNet: 3809.50, status: 'Pendente' },
  { id: 'TX-1026', event: 'Show Corporativo', gross: 8000, asaasFee: 19.90, platformFee: 1200, artistNet: 6780.10, status: 'Liquidado' },
  { id: 'TX-1027', event: 'Aniversário 15 anos', gross: 2200, asaasFee: 8.90, platformFee: 330, artistNet: 1861.10, status: 'Em Processamento' },
];

const AdminFinance = () => {
  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestão Financeira</h1>
          <p className="text-slate-500 mt-1">Visão consolidada de transações, taxas ASAAS e comissões líquidas.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
          <Download className="w-4 h-4" />
          Relatório Contábil
        </Button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Wallet className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+12%</span>
          </div>
          <p className="text-sm text-slate-500 font-medium">Volume Bruto (Mês)</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">R$ 154.200,50</h3>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-indigo-600 text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-white/10 rounded-lg">
              <Percent className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-indigo-100 text-sm font-medium">Comissão Líquida</p>
          <h3 className="text-2xl font-bold mt-1">R$ 23.130,00</h3>
          <p className="text-[10px] text-indigo-200 mt-2">Média de 15% por contrato</p>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-orange-50 rounded-lg">
              <CreditCard className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-slate-500 font-medium">Taxas ASAAS</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">R$ 1.845,20</h3>
          <p className="text-[10px] text-slate-400 mt-2">Custo operacional de gateway</p>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <ArrowRightLeft className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-sm text-slate-500 font-medium">Repasses Pendentes</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">R$ 42.800,00</h3>
          <p className="text-[10px] text-slate-400 mt-2">Aguardando conclusão de eventos</p>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-6 border-none shadow-sm bg-white">
          <h3 className="text-lg font-bold mb-6">Evolução de Receita vs Comissões</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="receita" stroke="#4f46e5" fillOpacity={1} fill="url(#colorRec)" strokeWidth={3} />
                <Area type="monotone" dataKey="comissao" stroke="#10b981" fillOpacity={0} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-white">
          <h3 className="text-lg font-bold mb-6">Distribuição de Custos</h3>
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Margem de Lucro</span>
                <span className="font-bold text-indigo-600">15%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full w-[15%]"></div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Taxas de Gateway</span>
                <span className="font-bold text-orange-600">1.2%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full w-[5%]"></div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Repasse Artistas</span>
                <span className="font-bold text-emerald-600">83.8%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full w-[83%]"></div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Transactions Table */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold text-slate-900">Extrato de Splits (ASAAS)</h3>
        </div>
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead>Valor Bruto</TableHead>
              <TableHead>Taxa ASAAS</TableHead>
              <TableHead>Comissão DUSHOW</TableHead>
              <TableHead>Líquido Artista</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{tx.event}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{tx.id}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm font-medium text-slate-900">
                  R$ {tx.gross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-sm text-orange-600">
                  - R$ {tx.asaasFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-sm font-bold text-indigo-600">
                  R$ {tx.platformFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-sm font-bold text-emerald-600">
                  R$ {tx.artistNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    tx.status === 'Liquidado' ? 'bg-emerald-50 text-emerald-600' : 
                    tx.status === 'Pendente' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
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

export default AdminFinance;