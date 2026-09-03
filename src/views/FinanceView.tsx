import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Calendar,
  FileText,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  CreditCard,
} from 'lucide-react';
import {
  getFinancialTransactions,
  saveFinancialTransaction,
  getAccountsReceivable,
  payInstallment,
  getClients,
  getCompanySettings,
  canViewFinancialData,
  canManageFinancialTransactions,
} from '../services/storage';
import {
  FinancialTransaction,
  AccountsReceivable,
  Client,
  PaymentMethod,
  User,
} from '../types';
import { formatCurrency, formatPhone, formatDate, getTodayString } from '../utils/formatters';

interface FinanceViewProps {
  currentUser?: User | null;
}

export const FinanceView: React.FC<FinanceViewProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'flow' | 'incomes' | 'expenses' | 'receivables'>('flow');
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [receivables, setReceivables] = useState<AccountsReceivable[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const canManageFinance = canManageFinancialTransactions(currentUser);
  const canSeeTotals = canViewFinancialData(currentUser);

  // Modals
  const [isNewTxOpen, setIsNewTxOpen] = useState(false);
  const [txType, setTxType] = useState<'entrada' | 'saida'>('entrada');
  const [txDescription, setTxDescription] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Serviços');
  const [txPaymentMethod, setTxPaymentMethod] = useState<PaymentMethod>('pix');

  const [activeDebtDoc, setActiveDebtDoc] = useState<AccountsReceivable | null>(null);

  const loadData = () => {
    setTransactions(getFinancialTransactions());
    setReceivables(getAccountsReceivable());
    setClients(getClients());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDescription || !txAmount) return;

    saveFinancialTransaction({
      type: txType,
      category: txCategory,
      description: txDescription,
      amount: Number(txAmount) || 0,
      date: getTodayString(),
      paymentMethod: txPaymentMethod,
      status: 'pago',
    });

    loadData();
    setIsNewTxOpen(false);
    setTxDescription('');
    setTxAmount('');
  };

  const handlePayInstallment = (receivableId: string, installmentNumber: number) => {
    payInstallment(receivableId, installmentNumber);
    loadData();
  };

  // Calculations
  const totalIncomes = transactions
    .filter((t) => t.type === 'entrada' && t.status === 'pago')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'saida' && t.status === 'pago')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncomes - totalExpenses;

  const totalPendingReceivables = receivables.reduce((sum, r) => {
    const unpaid = r.installments.filter((i) => i.status !== 'pago');
    return sum + unpaid.reduce((s, i) => s + i.amount, 0);
  }, 0);

  const settings = getCompanySettings();

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-sky-600" />
            <span>Gestão Financeira & Caixa</span>
          </h2>
          <p className="text-xs text-slate-500">Fluxo de caixa, contas a receber, nota promissória e saídas.</p>
        </div>

        {canManageFinance && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTxType('saida');
                setTxCategory('Insumos e Peças');
                setIsNewTxOpen(true);
              }}
              className="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <TrendingDown className="w-4 h-4 text-rose-600" />
              <span>+ Nova Saída</span>
            </button>

            <button
              onClick={() => {
                setTxType('entrada');
                setTxCategory('Serviços');
                setIsNewTxOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <TrendingUp className="w-4 h-4" />
              <span>+ Nova Entrada</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      {canSeeTotals ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Entradas Totais</span>
            <p className="text-lg font-black text-emerald-600">{formatCurrency(totalIncomes)}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Saídas Totais</span>
            <p className="text-lg font-black text-rose-600">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Saldo em Caixa</span>
            <p className={`text-lg font-black ${balance >= 0 ? 'text-sky-700' : 'text-rose-600'}`}>
              {formatCurrency(balance)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Contas a Receber (A Prazo)</span>
            <p className="text-lg font-black text-purple-700">{formatCurrency(totalPendingReceivables)}</p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p>
            <strong>Modo de Consulta Restrito:</strong> Os totais de faturamento e saldo em caixa estão ocultos para sua credencial de acesso.
          </p>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('flow')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'flow' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Extrato Completo
        </button>
        <button
          onClick={() => setActiveTab('incomes')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'incomes' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Somente Entradas
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'expenses' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Somente Saídas
        </button>
        <button
          onClick={() => setActiveTab('receivables')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'receivables' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Contas a Receber ({receivables.length})
        </button>
      </div>

      {/* TAB CONTENT: EXTRACT / TRANSACTIONS */}
      {activeTab !== 'receivables' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Lançamentos de Caixa</h3>

          <div className="space-y-2">
            {transactions
              .filter((t) => {
                if (activeTab === 'incomes') return t.type === 'entrada';
                if (activeTab === 'expenses') return t.type === 'saida';
                return true;
              })
              .map((tx) => (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center ${
                        tx.type === 'entrada' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {tx.type === 'entrada' ? '+' : '-'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{tx.description}</h4>
                      <p className="text-[11px] text-slate-500">
                        Categoria: {tx.category} • Forma: {tx.paymentMethod} • Data: {tx.date}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`font-black text-sm ${
                      tx.type === 'entrada' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {tx.type === 'entrada' ? '+' : '-'} {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: CONTAS A RECEBER (RECEIVABLES & DOCUMENTO DE DÍVIDA) */}
      {activeTab === 'receivables' && (
        <div className="space-y-4">
          {receivables.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
              <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-700">Nenhuma conta parcelada pendente no momento.</p>
            </div>
          ) : (
            receivables.map((rec) => {
              const client = clients.find((c) => c.id === rec.clientId);
              const paidCount = rec.installments.filter((i) => i.status === 'pago').length;

              return (
                <div
                  key={rec.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Cliente: {client ? client.name : 'Cliente Registrado'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Total Vendido: <strong>{formatCurrency(rec.totalAmount)}</strong> em {rec.installmentsCount}x
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveDebtDoc(rec)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5 text-sky-400" />
                        <span>Documento de Dívida / Promissória</span>
                      </button>
                    </div>
                  </div>

                  {/* Installments Table */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {rec.installments.map((inst) => (
                      <div
                        key={inst.number}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                          inst.status === 'pago'
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                            : inst.status === 'vencido'
                            ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div>
                          <span className="font-bold">Parcela {inst.number}/{rec.installmentsCount}</span>
                          <p className="text-[11px] opacity-80">Vence: {inst.dueDate}</p>
                          <p className="font-bold text-sm mt-0.5">{formatCurrency(inst.amount)}</p>
                        </div>

                        {inst.status === 'pago' ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-200/80 px-2 py-0.5 rounded-md uppercase">
                            Pago
                          </span>
                        ) : canManageFinance ? (
                          <button
                            onClick={() => handlePayInstallment(rec.id, inst.number)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg cursor-pointer shadow-xs"
                          >
                            Dar Baixa
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md uppercase">
                            Pendente
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* CREATE TRANSACTION MODAL */}
      {isNewTxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Lançar {txType === 'entrada' ? 'Entrada no Caixa' : 'Saída do Caixa'}
              </h3>
              <button onClick={() => setIsNewTxOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTxSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição *</label>
                <input
                  type="text"
                  required
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  placeholder="Ex: Pagamento de Fornecedor de Gás R134a"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="150.00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                  <input
                    type="text"
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Forma de Pagamento</label>
                <select
                  value={txPaymentMethod}
                  onChange={(e) => setTxPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                >
                  <option value="pix">PIX</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="debito">Débito</option>
                  <option value="credito">Crédito</option>
                  <option value="transferencia">Transferência</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewTxOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`text-white font-bold text-xs px-5 py-2 rounded-xl shadow-xs ${
                    txType === 'entrada' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROMISSÓRIA / DOCUMENTO DE DÍVIDA PRINTABLE MODAL */}
      {activeDebtDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <span className="text-sm font-bold">Documento de Confissão de Dívida / Promissória</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir PDF</span>
                </button>
                <button onClick={() => setActiveDebtDoc(null)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 text-slate-900 font-sans print:p-0">
              <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                <div>
                  <h1 className="text-lg font-black uppercase">{settings.name}</h1>
                  <p className="text-xs text-slate-600">CNPJ: {settings.cnpjCpf} • Tel: {formatPhone(settings.phone)}</p>
                </div>
                <div className="text-right">
                  <span className="bg-slate-900 text-white font-mono font-bold text-xs px-3 py-1 rounded-md uppercase">
                    Documento Não Fiscal
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <h3 className="font-bold text-slate-900 text-sm uppercase text-center border-b border-slate-200 pb-2">
                  Termo de Confissão e Compromisso de Pagamento
                </h3>

                {(() => {
                  const client = clients.find((c) => c.id === activeDebtDoc.clientId);
                  return (
                    <div className="space-y-2 pt-2 text-slate-700 leading-relaxed">
                      <p>
                        Eu, <strong>{client?.name || 'DEVEDOR'}</strong>, inscrito sob o CPF/CNPJ{' '}
                        <strong>{client?.cpfCnpj || 'Não Informado'}</strong>, declaro para os devidos fins que reconheço a
                        dívida no valor total de <strong>{formatCurrency(activeDebtDoc.totalAmount)}</strong> referente a
                        serviços de ar-condicionado automotivo executados pela empresa <strong>{settings.name}</strong>.
                      </p>

                      <p>Comprometo-me a efetuar o pagamento do valor acordado nas seguintes parcelas:</p>

                      <table className="w-full text-xs text-left border border-slate-200 my-2">
                        <thead className="bg-slate-100 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="p-2">Parcela</th>
                            <th className="p-2">Data de Vencimento</th>
                            <th className="p-2 text-right">Valor da Parcela</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {activeDebtDoc.installments.map((i) => (
                            <tr key={i.number}>
                              <td className="p-2 font-bold">Parcela {i.number} de {activeDebtDoc.installmentsCount}</td>
                              <td className="p-2">{i.dueDate}</td>
                              <td className="p-2 text-right font-bold">{formatCurrency(i.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs text-slate-600">
                <div className="border-t border-slate-400 pt-1">
                  <p className="font-bold text-slate-800">{settings.name}</p>
                  <p className="text-[10px]">Credor</p>
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <p className="font-bold text-slate-800">Assinatura do Devedor</p>
                  <p className="text-[10px]">Reconhecimento da Dívida</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
