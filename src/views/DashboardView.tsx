import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wrench,
  Users,
  AlertTriangle,
  Cake,
  Clock,
  Package,
  PlusCircle,
  MessageSquare,
  ArrowRight,
  ShieldAlert,
  Car,
  FileText,
} from 'lucide-react';
import {
  getFinancialTransactions,
  getWorkOrders,
  getClients,
  getStockProducts,
  getAccountsReceivable,
  getMaintenanceReminders,
  getFollowUps,
} from '../services/storage';
import { formatCurrency, formatPhone } from '../utils/formatters';
import { ActiveTab } from '../components/Navigation';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenQuickAttendance: () => void;
  onSelectClient?: (clientId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  onOpenQuickAttendance,
  onSelectClient,
}) => {
  const transactions = getFinancialTransactions();
  const workOrders = getWorkOrders();
  const clients = getClients();
  const stock = getStockProducts();
  const receivables = getAccountsReceivable();
  const maintenanceReminders = getMaintenanceReminders();
  const followUps = getFollowUps();

  // Current Month Financial Calculations
  const todayDate = new Date();
  const currentMonthStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}`;

  const monthIncomes = transactions
    .filter((t) => t.type === 'entrada' && t.status === 'pago' && t.date.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpenses = transactions
    .filter((t) => t.type === 'saida' && t.status === 'pago' && t.date.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + t.amount, 0);

  const monthResult = monthIncomes - monthExpenses;

  const monthOrders = workOrders.filter((w) => w.createdAt.startsWith(currentMonthStr));
  const monthServicesCount = monthOrders.length;
  const averageTicket = monthServicesCount > 0 ? monthIncomes / monthServicesCount : 0;

  // Alerts calculation
  const currentDay = todayDate.getDate();
  const currentMonth = todayDate.getMonth() + 1;

  const birthdaysToday = clients.filter((c) => c.birthDay === currentDay && c.birthMonth === currentMonth);
  const lowStockItems = stock.filter((s) => s.currentQuantity <= s.minimumQuantity);
  const overdueReceivables = receivables.flatMap((r) =>
    r.installments.filter((i) => i.status === 'vencido')
  );
  const pendingFollowUps = followUps.filter((f) => f.status === 'pendente');
  const pendingReminders = maintenanceReminders.filter((m) => m.status === 'pendente');

  const totalAlerts =
    birthdaysToday.length +
    lowStockItems.length +
    overdueReceivables.length +
    pendingFollowUps.length +
    pendingReminders.length;

  return (
    <div className="space-y-6 pb-12">
      {/* Greeting Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white p-6 rounded-2xl shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] font-bold px-3 py-1 rounded-full mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Oficina em Operação</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Olá, Vinícius</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Veja como está o desempenho e os alertas da sua oficina hoje.
            </p>
          </div>

          <button
            onClick={onOpenQuickAttendance}
            className="self-start md:self-auto bg-sky-500 hover:bg-sky-400 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg shadow-sky-900/50 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Novo Atendimento Rápido</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Faturamento */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Faturamento</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900">{formatCurrency(monthIncomes)}</p>
          <p className="text-[10px] text-slate-400 font-medium">Entradas do mês</p>
        </div>

        {/* Despesas */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Despesas</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900">{formatCurrency(monthExpenses)}</p>
          <p className="text-[10px] text-slate-400 font-medium">Saídas do mês</p>
        </div>

        {/* Resultado */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Resultado</span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                monthResult >= 0 ? 'bg-sky-50 text-sky-600' : 'bg-rose-50 text-rose-600'
              }`}
            >
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-lg font-black ${monthResult >= 0 ? 'text-sky-700' : 'text-rose-600'}`}>
            {formatCurrency(monthResult)}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">Lucro operacional</p>
        </div>

        {/* Atendimentos */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Serviços</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900">{monthServicesCount}</p>
          <p className="text-[10px] text-slate-400 font-medium">Ordens neste mês</p>
        </div>

        {/* Ticket Médio */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ticket Médio</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900">{formatCurrency(averageTicket)}</p>
          <p className="text-[10px] text-slate-400 font-medium">Média por cliente</p>
        </div>
      </div>

      {/* QUICK ACTIONS BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">Ações Rápidas da Oficina</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <button
            onClick={() => setActiveTab('clients')}
            className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-xl text-slate-800 hover:text-sky-800 text-xs font-bold transition-all cursor-pointer"
          >
            <Users className="w-4 h-4 text-sky-600" />
            <span>+ Novo Cliente</span>
          </button>

          <button
            onClick={() => setActiveTab('quotes')}
            className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-xl text-slate-800 hover:text-sky-800 text-xs font-bold transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-sky-600" />
            <span>+ Novo Orçamento</span>
          </button>

          <button
            onClick={() => setActiveTab('work_orders')}
            className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-xl text-slate-800 hover:text-sky-800 text-xs font-bold transition-all cursor-pointer"
          >
            <Wrench className="w-4 h-4 text-sky-600" />
            <span>+ Novo Serviço</span>
          </button>

          <button
            onClick={() => setActiveTab('finance')}
            className="flex items-center justify-center gap-2 p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>+ Entradas</span>
          </button>

          <button
            onClick={() => setActiveTab('finance')}
            className="flex items-center justify-center gap-2 p-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 text-xs font-bold rounded-xl transition-all cursor-pointer col-span-2 sm:col-span-1"
          >
            <TrendingDown className="w-4 h-4 text-rose-600" />
            <span>+ Saídas</span>
          </button>
        </div>
      </div>

      {/* SECTION: PRECISA DA SUA ATENÇÃO (ALERTS) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Precisa da sua atenção</h3>
              <p className="text-[11px] text-slate-500">
                {totalAlerts > 0
                  ? `${totalAlerts} itens requerem ação para manter o bom relacionamento com os clientes.`
                  : 'Tudo em dia na sua oficina!'}
              </p>
            </div>
          </div>
          {totalAlerts > 0 && (
            <span className="bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {totalAlerts} pendência(s)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Birthdays Today */}
          {birthdaysToday.length > 0 && (
            <div
              onClick={() => setActiveTab('relationship')}
              className="p-3.5 rounded-xl bg-pink-50/60 border border-pink-200 flex items-center justify-between hover:bg-pink-50 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3">
                <Cake className="w-5 h-5 text-pink-600" />
                <div>
                  <h4 className="text-xs font-bold text-pink-950">
                    {birthdaysToday.length} Aniversariante(s) Hoje!
                  </h4>
                  <p className="text-[11px] text-pink-700">
                    {birthdaysToday.map((c) => c.name).join(', ')}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-pink-400 group-hover:text-pink-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          )}

          {/* Pending Follow-Ups */}
          {pendingFollowUps.length > 0 && (
            <div
              onClick={() => setActiveTab('relationship')}
              className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-200 flex items-center justify-between hover:bg-sky-50 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-sky-600" />
                <div>
                  <h4 className="text-xs font-bold text-sky-950">
                    {pendingFollowUps.length} Pós-Atendimento(s) Pendentes
                  </h4>
                  <p className="text-[11px] text-sky-700">Pergunte aos clientes se ficou tudo bem com o ar.</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-sky-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          )}

          {/* Overdue Returns */}
          {pendingReminders.length > 0 && (
            <div
              onClick={() => setActiveTab('relationship')}
              className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between hover:bg-amber-50 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-600" />
                <div>
                  <h4 className="text-xs font-bold text-amber-950">
                    {pendingReminders.length} Retorno(s) de Manutenção
                  </h4>
                  <p className="text-[11px] text-amber-700">Lembre o cliente de higienizar o ar novamente.</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          )}

          {/* Low Stock Items */}
          {lowStockItems.length > 0 && (
            <div
              onClick={() => setActiveTab('stock')}
              className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200 flex items-center justify-between hover:bg-rose-50 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-rose-600" />
                <div>
                  <h4 className="text-xs font-bold text-rose-950">
                    {lowStockItems.length} Iten(s) com Estoque Baixo!
                  </h4>
                  <p className="text-[11px] text-rose-700">
                    {lowStockItems.map((s) => s.name).join(', ')}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-rose-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          )}

          {/* Overdue Receivables */}
          {overdueReceivables.length > 0 && (
            <div
              onClick={() => setActiveTab('finance')}
              className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 flex items-center justify-between hover:bg-purple-50 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-purple-600" />
                <div>
                  <h4 className="text-xs font-bold text-purple-950">
                    {overdueReceivables.length} Parcela(s) de Clientes Vencidas
                  </h4>
                  <p className="text-[11px] text-purple-700">Acesse o financeiro para realizar cobrança.</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          )}
        </div>
      </div>

      {/* RECENT SERVICES TIMELINE TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900">Últimos Atendimentos Registrados</h3>
          <button
            onClick={() => setActiveTab('work_orders')}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            <span>Ver Todos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {workOrders.slice(0, 5).map((order) => {
            const client = clients.find((c) => c.id === order.clientId);
            return (
              <div
                key={order.id}
                onClick={() => setActiveTab('work_orders')}
                className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-xs">
                    OS
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{order.code}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          order.status === 'finalizado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'em_andamento'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {order.status === 'finalizado'
                          ? 'Finalizado'
                          : order.status === 'em_andamento'
                          ? 'Em Andamento'
                          : 'Aberto'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {client ? client.name : 'Cliente'} • {order.items.length} item(ns)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{formatCurrency(order.totalAmount)}</p>
                  <p className="text-[10px] text-slate-400">{order.date}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
