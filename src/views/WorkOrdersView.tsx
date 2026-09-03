import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  X,
  Trash2,
  ShieldCheck,
  DollarSign,
  AlertCircle,
  Share2,
} from 'lucide-react';
import {
  getWorkOrders,
  saveWorkOrder,
  getClients,
  getVehicles,
  getServiceCatalog,
  getStockProducts,
  getCompanySettings,
} from '../services/storage';
import {
  WorkOrder,
  Client,
  Vehicle,
  ServiceCatalog,
  StockProduct,
  OrderItem,
  PaymentMethod,
  WorkOrderStatus,
} from '../types';
import {
  formatCurrency,
  formatPhone,
  formatDate,
  getTodayString,
  addMonthsToDate,
  buildWhatsAppUrl,
} from '../utils/formatters';

interface WorkOrdersViewProps {
  onOpenQuickAttendance: () => void;
}

export const WorkOrdersView: React.FC<WorkOrdersViewProps> = ({ onOpenQuickAttendance }) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<ServiceCatalog[]>([]);
  const [stock, setStock] = useState<StockProduct[]>([]);

  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'todos'>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Active Modals
  const [activeVoucherOrder, setActiveVoucherOrder] = useState<WorkOrder | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Partial<WorkOrder> | null>(null);

  // Edit Form Fields
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [mileage, setMileage] = useState('');
  const [complaint, setComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [laborCost, setLaborCost] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [status, setStatus] = useState<WorkOrderStatus>('aberto');
  const [warrantyDays, setWarrantyDays] = useState('90');
  const [notes, setNotes] = useState('');

  // Controlled dropdown selection state
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedStockId, setSelectedStockId] = useState('');

  const loadData = () => {
    setWorkOrders(getWorkOrders());
    setClients(getClients());
    setVehicles(getVehicles());
    setServices(getServiceCatalog());
    setStock(getStockProducts());
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewOrderModal = () => {
    setEditingOrder(null);
    setSelectedClientId(clients[0]?.id || '');
    setSelectedVehicleId('');
    setMileage('45000');
    setComplaint('');
    setDiagnosis('');
    setItems([]);
    setLaborCost('0');
    setDiscount('0');
    setPaymentMethod('pix');
    setStatus('aberto');
    setWarrantyDays('90');
    setNotes('');
    setIsEditModalOpen(true);
  };

  const openEditOrderModal = (wo: WorkOrder) => {
    setEditingOrder(wo);
    setSelectedClientId(wo.clientId);
    setSelectedVehicleId(wo.vehicleId);
    setMileage(String(wo.mileage));
    setComplaint(wo.clientComplaint || '');
    setDiagnosis(wo.diagnosis || '');
    setItems(wo.items || []);
    setLaborCost(String(wo.laborCost || 0));
    setDiscount(String(wo.discount || 0));
    setPaymentMethod(wo.paymentMethod);
    setStatus(wo.status);
    setWarrantyDays(String(wo.warrantyDays || 90));
    setNotes(wo.notes || '');
    setIsEditModalOpen(true);
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

  const handleSaveOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !selectedVehicleId) return;

    const total = calculateTotal();
    const today = getTodayString();
    const nextReturnDate = addMonthsToDate(today, 6);

    saveWorkOrder({
      id: editingOrder?.id,
      clientId: selectedClientId,
      vehicleId: selectedVehicleId,
      date: editingOrder?.date || today,
      mileage: Number(mileage) || 0,
      clientComplaint: complaint,
      diagnosis: diagnosis,
      items,
      laborCost: Number(laborCost) || 0,
      discount: Number(discount) || 0,
      totalAmount: total,
      paymentMethod,
      status,
      warrantyDays: Number(warrantyDays) || 90,
      nextReturnDate,
      notes,
    });

    loadData();
    setIsEditModalOpen(false);
  };

  const filteredOrders = workOrders.filter((wo) => {
    if (statusFilter !== 'todos' && wo.status !== statusFilter) return false;
    if (!searchTerm) return true;

    const term = searchTerm.toLowerCase();
    const client = clients.find((c) => c.id === wo.clientId);
    const vehicle = vehicles.find((v) => v.id === wo.vehicleId);

    return (
      wo.code.toLowerCase().includes(term) ||
      (client && client.name.toLowerCase().includes(term)) ||
      (vehicle && vehicle.plate.toLowerCase().includes(term.replace(/[^a-zA-Z0-9]/g, '')))
    );
  });

  const settings = getCompanySettings();

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-sky-600" />
            <span>Ordens de Serviço ({workOrders.length})</span>
          </h2>
          <p className="text-xs text-slate-500">Gestão de ateliê técnico e comprovantes não fiscais.</p>
        </div>

        <button
          onClick={openNewOrderModal}
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Nova Ordem de Serviço</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 w-full md:w-auto overflow-x-auto text-xs font-bold">
          {(['todos', 'aberto', 'em_andamento', 'finalizado', 'cancelado'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl capitalize transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'todos' ? 'Todos' : st === 'em_andamento' ? 'Em Andamento' : st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por número da OS (ex: OS-1001), cliente ou placa..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>
      </div>

      {/* Work Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
            <Wrench className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-700">Nenhuma Ordem de Serviço encontrada.</p>
            <p className="text-[11px] mt-1 text-slate-400">Clique acima para registrar o primeiro atendimento.</p>
          </div>
        ) : (
          filteredOrders.map((wo) => {
            const client = clients.find((c) => c.id === wo.clientId);
            const vehicle = vehicles.find((v) => v.id === wo.vehicleId);

            return (
              <div
                key={wo.id}
                className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      {wo.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                        wo.status === 'finalizado'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : wo.status === 'em_andamento'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {wo.status === 'em_andamento' ? 'Em Andamento' : wo.status}
                    </span>
                    <span className="text-xs text-slate-400">• Data: {wo.date}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700">
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
                    <strong>Serviços:</strong> {wo.items.map((i) => i.description).join(', ') || 'Sem itens'}
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-end justify-between md:justify-center border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 gap-3">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Valor Total</span>
                    <p className="text-base font-black text-sky-700">{formatCurrency(wo.totalAmount)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveVoucherOrder(wo)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1 cursor-pointer"
                      title="Imprimir / Ver Comprovante Não Fiscal"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      <span>Comprovante</span>
                    </button>

                    <button
                      onClick={() => openEditOrderModal(wo)}
                      className="bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs px-3 py-1.5 rounded-xl border border-sky-200 cursor-pointer"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT WORK ORDER MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-sky-600" />
                <span>{editingOrder ? `Editar ${editingOrder.code}` : 'Nova Ordem de Serviço'}</span>
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOrderSubmit} className="space-y-4">
              {/* Client & Vehicle Pickers */}
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">Selecione o Cliente</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({formatPhone(c.phone)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Veículo (Placa) *</label>
                  <select
                    required
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">Selecione o Veículo</option>
                    {vehicles
                      .filter((v) => v.clientId === selectedClientId)
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.plate} — {v.make} {v.model} ({v.year})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quilometragem (km)</label>
                  <input
                    type="number"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    placeholder="45000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status da O.S. *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as WorkOrderStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="aberto">Aberto</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="finalizado">Finalizado (Baixa em Estoque + Financeiro)</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Forma de Pagamento</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="pix">PIX</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="debito">Cartão de Débito</option>
                    <option value="credito">Cartão de Crédito</option>
                    <option value="transferencia">Transferência / TED</option>
                    <option value="prazo">A Prazo / Parcelado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reclamação do Cliente</label>
                  <input
                    type="text"
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    placeholder="Ex: Ar não gela e faz barulho no compressor"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Diagnóstico Técnico</label>
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="Ex: Válvula de expansão travada"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Items Table / Catalog Adders */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Itens da Ordem de Serviço
                  </label>
                </div>

                {/* Catalog Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Adicionar Serviço do Catálogo:</span>
                    <select
                      value={selectedServiceId}
                      onChange={handleServiceSelectChange}
                      className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium cursor-pointer"
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
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Adicionar Peça do Estoque:</span>
                    <select
                      value={selectedStockId}
                      onChange={handleStockSelectChange}
                      className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium cursor-pointer"
                    >
                      <option value="">+ Selecionar Peça</option>
                      {stock.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({formatCurrency(p.salePrice)} - Estq: {p.currentQuantity})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Items List */}
                {items.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 text-center bg-slate-50 rounded-xl">
                    Nenhum item adicionado à ordem.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-slate-800">{item.description}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 font-bold uppercase text-slate-600">
                            {item.type}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const qty = Number(e.target.value) || 1;
                              const updated = [...items];
                              updated[idx].quantity = qty;
                              updated[idx].totalPrice = qty * updated[idx].unitPrice;
                              setItems(updated);
                            }}
                            className="w-14 px-2 py-1 bg-white border border-slate-300 rounded text-center text-xs font-bold"
                          />
                          <span className="font-bold text-slate-900 w-20 text-right">
                            {formatCurrency(item.totalPrice)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total Calculation Grid */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Mão de Obra (R$)</label>
                    <input
                      type="number"
                      value={laborCost}
                      onChange={(e) => setLaborCost(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg font-bold text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Desconto (R$)</label>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg font-bold text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Garantia (Dias)</label>
                    <input
                      type="number"
                      value={warrantyDays}
                      onChange={(e) => setWarrantyDays(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg font-bold text-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-sm font-bold">VALOR TOTAL FINAL:</span>
                  <span className="text-xl font-black text-sky-400">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs"
                >
                  Salvar Ordem de Serviço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NON-FISCAL SERVICE VOUCHER PRINT MODAL */}
      {activeVoucherOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Action Bar Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                <span className="text-sm font-bold">Comprovante de Serviço — Documento Não Fiscal</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir PDF</span>
                </button>
                <button
                  onClick={() => setActiveVoucherOrder(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINTABLE COMPROVANTE CONTENT */}
            <div className="p-8 space-y-6 text-slate-900 font-sans print:p-0">
              {/* Company Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-black uppercase text-slate-900">{settings.name}</h1>
                  <p className="text-xs text-slate-600 font-medium">{settings.address} - {settings.city}/{settings.state}</p>
                  <p className="text-xs text-slate-600">WhatsApp: {formatPhone(settings.whatsapp)} • CNPJ: {settings.cnpjCpf}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] rounded-md uppercase">
                    Documento Não Fiscal
                  </span>
                  <p className="text-sm font-black font-mono mt-2">{activeVoucherOrder.code}</p>
                  <p className="text-xs text-slate-500">Emissão: {formatDate(activeVoucherOrder.date)}</p>
                </div>
              </div>

              {/* Client & Vehicle Info Grid */}
              {(() => {
                const client = clients.find((c) => c.id === activeVoucherOrder.clientId);
                const vehicle = vehicles.find((v) => v.id === activeVoucherOrder.vehicleId);

                return (
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <div className="space-y-1">
                      <p className="font-bold uppercase text-[10px] text-slate-400">Dados do Cliente</p>
                      <p className="font-bold text-slate-900">{client ? client.name : '-'}</p>
                      <p className="text-slate-600">Tel/WhatsApp: {client ? formatPhone(client.phone) : '-'}</p>
                      <p className="text-slate-600">Endereço: {client?.address || '-'}</p>
                    </div>

                    <div className="space-y-1 border-l border-slate-200 pl-4">
                      <p className="font-bold uppercase text-[10px] text-slate-400">Dados do Veículo</p>
                      <p className="font-bold text-slate-900">
                        {vehicle?.make} {vehicle?.model} {vehicle?.version} ({vehicle?.year})
                      </p>
                      <p className="font-mono font-bold text-slate-900">PLACA: {vehicle?.plate}</p>
                      <p className="text-slate-600">Quilometragem: {activeVoucherOrder.mileage.toLocaleString('pt-BR')} km</p>
                    </div>
                  </div>
                );
              })()}

              {/* Items Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-700">
                  Discriminação dos Serviços e Peças
                </h4>
                <table className="w-full text-xs text-left border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Descrição</th>
                      <th className="p-2.5 text-center">Tipo</th>
                      <th className="p-2.5 text-center">Qtd</th>
                      <th className="p-2.5 text-right">Unitário</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {activeVoucherOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td className="p-2.5 font-medium">{item.description}</td>
                        <td className="p-2.5 text-center uppercase text-[10px] font-bold text-slate-500">{item.type}</td>
                        <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                        <td className="p-2.5 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-2.5 text-right font-bold">{formatCurrency(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="flex justify-end pt-2">
                <div className="w-64 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Mão de Obra:</span>
                    <span>{formatCurrency(activeVoucherOrder.laborCost)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Desconto:</span>
                    <span>- {formatCurrency(activeVoucherOrder.discount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-200">
                    <span>TOTAL GERAL:</span>
                    <span className="text-sky-700 font-black">{formatCurrency(activeVoucherOrder.totalAmount)}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1 text-right capitalize">
                    Forma: {activeVoucherOrder.paymentMethod}
                  </div>
                </div>
              </div>

              {/* Terms & Warranty */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-900">Garantia e Condições:</p>
                <p>
                  Garantia legal de <strong>{activeVoucherOrder.warrantyDays} dias</strong> a contar desta data contra defeitos de
                  execução dos serviços descritos neste documento.
                </p>
                <p className="text-[10px] text-slate-500">{settings.footerText}</p>
              </div>

              {/* Signature Lines */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs text-slate-600">
                <div className="border-t border-slate-400 pt-1">
                  <p className="font-bold text-slate-800">{settings.name}</p>
                  <p className="text-[10px]">Técnico Responsável</p>
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <p className="font-bold text-slate-800">Assinatura do Cliente</p>
                  <p className="text-[10px]">De acordo com os serviços prestados</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
