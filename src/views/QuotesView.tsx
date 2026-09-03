import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Plus,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Trash2,
  X,
  Share2,
} from 'lucide-react';
import {
  getQuotes,
  saveQuote,
  convertQuoteToWorkOrder,
  getClients,
  getVehicles,
  getServiceCatalog,
  getStockProducts,
} from '../services/storage';
import {
  Quote,
  Client,
  Vehicle,
  ServiceCatalog,
  StockProduct,
  OrderItem,
  QuoteStatus,
} from '../types';
import { formatCurrency, formatPhone, getTodayString, addDaysToDate } from '../utils/formatters';

interface QuotesViewProps {
  onWorkOrderCreated: (workOrderId: string) => void;
}

export const QuotesView: React.FC<QuotesViewProps> = ({ onWorkOrderCreated }) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<ServiceCatalog[]>([]);
  const [stock, setStock] = useState<StockProduct[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Partial<Quote> | null>(null);

  // Form
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [validUntil, setValidUntil] = useState(addDaysToDate(getTodayString(), 10));
  const [items, setItems] = useState<OrderItem[]>([]);
  const [laborCost, setLaborCost] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [status, setStatus] = useState<QuoteStatus>('rascunho');
  const [notes, setNotes] = useState('');

  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedStockId, setSelectedStockId] = useState('');

  const loadData = () => {
    setQuotes(getQuotes());
    setClients(getClients());
    setVehicles(getVehicles());
    setServices(getServiceCatalog());
    setStock(getStockProducts());
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewModal = () => {
    setEditingQuote(null);
    setSelectedClientId(clients[0]?.id || '');
    setSelectedVehicleId('');
    setValidUntil(addDaysToDate(getTodayString(), 10));
    setItems([]);
    setLaborCost('0');
    setDiscount('0');
    setStatus('rascunho');
    setNotes('');
    setSelectedServiceId('');
    setSelectedStockId('');
    setIsModalOpen(true);
  };

  const addServiceItem = (srv: ServiceCatalog) => {
    setItems((prevItems) => [
      ...prevItems,
      {
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
        type: 'servico',
        refId: srv.id,
        description: srv.name,
        quantity: 1,
        unitPrice: srv.defaultPrice,
        totalPrice: srv.defaultPrice,
      },
    ]);
  };

  const addStockItem = (prod: StockProduct) => {
    setItems((prevItems) => [
      ...prevItems,
      {
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
        type: 'peca',
        refId: prod.id,
        description: prod.name,
        quantity: 1,
        unitPrice: prod.salePrice,
        totalPrice: prod.salePrice,
      },
    ]);
  };

  const handleServiceSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    const srv = services.find((s) => s.id === val);
    if (srv) {
      addServiceItem(srv);
    }
    setSelectedServiceId('');
  };

  const handleStockSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    const prod = stock.find((p) => p.id === val);
    if (prod) {
      addStockItem(prod);
    }
    setSelectedStockId('');
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const calculateSubtotal = () => items.reduce((sum, i) => sum + i.totalPrice, 0);
  const calculateTotal = () => {
    const sub = calculateSubtotal();
    const lCost = Number(laborCost) || 0;
    const disc = Number(discount) || 0;
    return Math.max(0, sub + lCost - disc);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !selectedVehicleId) return;

    saveQuote({
      id: editingQuote?.id,
      clientId: selectedClientId,
      vehicleId: selectedVehicleId,
      date: editingQuote?.date || getTodayString(),
      validUntil,
      items,
      laborCost: Number(laborCost) || 0,
      discount: Number(discount) || 0,
      totalAmount: calculateTotal(),
      status,
      notes,
    });

    loadData();
    setIsModalOpen(false);
  };

  const handleConvert = (quoteId: string) => {
    const wo = convertQuoteToWorkOrder(quoteId);
    if (wo) {
      loadData();
      onWorkOrderCreated(wo.id);
    }
  };

  const filteredQuotes = quotes.filter((q) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const client = clients.find((c) => c.id === q.clientId);
    return q.code.toLowerCase().includes(term) || (client && client.name.toLowerCase().includes(term));
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600" />
            <span>Orçamentos de Clientes ({quotes.length})</span>
          </h2>
          <p className="text-xs text-slate-500">Cotações com conversão em 1-clique para Ordem de Serviço.</p>
        </div>

        <button
          onClick={openNewModal}
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Orçamento</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar orçamento por código (ex: ORC-2001) ou cliente..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
      </div>

      {/* Quotes List */}
      <div className="space-y-3">
        {filteredQuotes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
            <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-700">Nenhum Orçamento cadastrado.</p>
          </div>
        ) : (
          filteredQuotes.map((q) => {
            const client = clients.find((c) => c.id === q.clientId);
            const vehicle = vehicles.find((v) => v.id === q.vehicleId);

            return (
              <div
                key={q.id}
                className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      {q.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                        q.status === 'convertido'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : q.status === 'enviado'
                          ? 'bg-sky-100 text-sky-800 border border-sky-200'
                          : q.status === 'aprovado'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {q.status === 'convertido' ? 'Convertido em O.S.' : q.status}
                    </span>
                    <span className="text-xs text-slate-400">• Válido até {q.validUntil}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-700">
                    <div>
                      <strong>Cliente:</strong> {client ? client.name : '-'}
                    </div>
                    {vehicle && (
                      <div className="flex items-center gap-1">
                        <strong>Veículo:</strong>
                        <span className="font-mono bg-slate-900 text-white px-1.5 py-0.2 rounded text-[10px]">
                          {vehicle.plate}
                        </span>
                        <span>
                          ({vehicle.make} {vehicle.model})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <strong>Itens:</strong> {q.items.map((i) => i.description).join(', ') || 'Nenhum item'}
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-end justify-between md:justify-center border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 gap-3">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Valor do Orçamento</span>
                    <p className="text-base font-black text-sky-700">{formatCurrency(q.totalAmount)}</p>
                  </div>

                  {q.status !== 'convertido' ? (
                    <button
                      onClick={() => handleConvert(q.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>Transformar em O.S.</span>
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                      O.S. Gerada com Sucesso
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* NEW / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-600" />
                <span>Novo Orçamento</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cliente *</label>
                  <select
                    required
                    value={selectedClientId}
                    onChange={(e) => {
                      setSelectedClientId(e.target.value);
                      const clientVehs = vehicles.filter((v) => v.clientId === e.target.value);
                      if (clientVehs.length > 0) setSelectedVehicleId(clientVehs[0].id);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                  >
                    <option value="">Selecione o Cliente</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Veículo *</label>
                  <select
                    required
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                  >
                    <option value="">Selecione o Veículo</option>
                    {vehicles
                      .filter((v) => v.clientId === selectedClientId)
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.plate} — {v.make} {v.model}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Validade do Orçamento</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as QuoteStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    <option value="rascunho">Rascunho</option>
                    <option value="enviado">Enviado ao Cliente</option>
                    <option value="aprovado">Aprovado</option>
                    <option value="recusado">Recusado</option>
                  </select>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-800 uppercase">Itens do Orçamento</label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Adicionar Serviço:</span>
                    <select
                      value={selectedServiceId}
                      onChange={handleServiceSelectChange}
                      className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs cursor-pointer"
                    >
                      <option value="">+ Selecionar Serviço</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({formatCurrency(s.defaultPrice)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Adicionar Peça:</span>
                    <select
                      value={selectedStockId}
                      onChange={handleStockSelectChange}
                      className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs cursor-pointer"
                    >
                      <option value="">+ Selecionar Peça</option>
                      {stock.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({formatCurrency(p.salePrice)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="space-y-1.5">
                    {items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-slate-800">{item.description}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-900">{formatCurrency(item.totalPrice)}</span>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total Calculation */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between text-xs">
                <span className="font-bold">TOTAL ESTIMADO:</span>
                <span className="text-xl font-black text-sky-400">{formatCurrency(calculateTotal())}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs"
                >
                  Salvar Orçamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
