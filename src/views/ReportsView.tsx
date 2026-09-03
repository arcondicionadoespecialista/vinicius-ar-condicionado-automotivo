import React from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wrench,
  Package,
  Users,
  DollarSign,
} from 'lucide-react';
import {
  getFinancialTransactions,
  getWorkOrders,
  getClients,
  getStockProducts,
} from '../services/storage';
import { formatCurrency } from '../utils/formatters';

export const ReportsView: React.FC = () => {
  const transactions = getFinancialTransactions();
  const workOrders = getWorkOrders();
  const clients = getClients();
  const stock = getStockProducts();

  const totalIncomes = transactions
    .filter((t) => t.type === 'entrada' && t.status === 'pago')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'saida' && t.status === 'pago')
    .reduce((sum, t) => sum + t.amount, 0);

  const stockValuation = stock.reduce((sum, p) => sum + p.currentQuantity * p.costPrice, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-600" />
            <span>Relatórios & Visão Gerencial</span>
          </h2>
          <p className="text-xs text-slate-500">Métricas de rentabilidade, patrimônio de estoque e faturamento.</p>
        </div>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Receita Bruta</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{formatCurrency(totalIncomes)}</p>
          <p className="text-[11px] text-slate-400">Total acumulado de entradas</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Patrimônio de Estoque</span>
            <Package className="w-5 h-5 text-sky-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{formatCurrency(stockValuation)}</p>
          <p className="text-[11px] text-slate-400">Valor investido em peças em estoque</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total de Serviços</span>
            <Wrench className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{workOrders.length}</p>
          <p className="text-[11px] text-slate-400">Ordens de serviço registradas</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Base de Clientes</span>
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{clients.length}</p>
          <p className="text-[11px] text-slate-400">Clientes ativos cadastrados</p>
        </div>
      </div>
    </div>
  );
};
