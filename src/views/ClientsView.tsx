import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageCircle,
  Car,
  Clock,
  Cake,
  X,
  PlusCircle,
  Wrench,
  User,
  ArrowRight,
  FileText,
} from 'lucide-react';
import {
  getClients,
  saveClient,
  getVehicles,
  getWorkOrders,
  saveVehicle,
  getCompanySettings,
} from '../services/storage';
import { Client, Vehicle, WorkOrder } from '../types';
import { formatPhone, formatCpfCnpj, formatCurrency, buildWhatsAppUrl, normalizePlate } from '../utils/formatters';

interface ClientsViewProps {
  onOpenQuickAttendance: (clientId?: string, vehicleId?: string) => void;
  selectedClientId?: string | null;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  onOpenQuickAttendance,
  selectedClientId,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Active Drawer States
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);

  // Form States
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    phone: '',
    whatsapp: '',
    cpfCnpj: '',
    email: '',
    address: '',
    city: 'Divinópolis',
    state: 'MG',
    birthDay: undefined,
    birthMonth: undefined,
    notes: '',
  });

  const [vehFormData, setVehFormData] = useState({
    plate: '',
    make: 'Chevrolet',
    model: '',
    version: '',
    year: '2021',
    mileage: '40000',
  });

  const loadData = () => {
    const loadedClients = getClients();
    setClients(loadedClients);
    setVehicles(getVehicles());
    setWorkOrders(getWorkOrders());

    if (selectedClientId) {
      const found = loadedClients.find((c) => c.id === selectedClientId);
      if (found) setActiveClient(found);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClientId]);

  const handleSaveClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    const saved = saveClient({
      ...formData,
      name: formData.name,
      phone: formData.phone,
      whatsapp: formData.whatsapp || formData.phone,
    });

    loadData();
    setActiveClient(saved);
    setIsNewClientOpen(false);
    setFormData({
      name: '',
      phone: '',
      whatsapp: '',
      cpfCnpj: '',
      email: '',
      address: '',
      city: 'Divinópolis',
      state: 'MG',
      notes: '',
    });
  };

  const handleAddVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClient || !vehFormData.plate || !vehFormData.model) return;

    saveVehicle({
      clientId: activeClient.id,
      plate: vehFormData.plate,
      make: vehFormData.make,
      model: vehFormData.model,
      version: vehFormData.version,
      year: Number(vehFormData.year) || 2021,
      mileage: Number(vehFormData.mileage) || 0,
    });

    loadData();
    setIsAddVehicleOpen(false);
    setVehFormData({
      plate: '',
      make: 'Chevrolet',
      model: '',
      version: '',
      year: '2021',
      mileage: '40000',
    });
  };

  const term = searchTerm.trim().toLowerCase();
  const cleanTerm = term.replace(/[^a-zA-Z0-9]/g, '');

  const filteredClients = clients.filter((c) => {
    if (!term) return true;
    const clientVehicles = vehicles.filter((v) => v.clientId === c.id);
    const hasMatchingPlate = clientVehicles.some((v) => v.plate.toLowerCase().includes(cleanTerm));

    return (
      c.name.toLowerCase().includes(term) ||
      c.phone.replace(/\D/g, '').includes(cleanTerm) ||
      (c.cpfCnpj && c.cpfCnpj.replace(/\D/g, '').includes(cleanTerm)) ||
      hasMatchingPlate
    );
  });

  const settings = getCompanySettings();

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            <span>Gestão de Clientes ({clients.length})</span>
          </h2>
          <p className="text-xs text-slate-500">Histórico unificado de veículos, contatos e WhatsApp.</p>
        </div>

        <button
          onClick={() => setIsNewClientOpen(true)}
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Cliente</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar por nome, WhatsApp, CPF ou placa do carro (ex: ABC1D23)..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
      </div>

      {/* Client List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          const clientVehs = vehicles.filter((v) => v.clientId === client.id);
          const clientOrders = workOrders.filter((w) => w.clientId === client.id);

          return (
            <div
              key={client.id}
              onClick={() => setActiveClient(client)}
              className={`p-4 rounded-2xl border bg-white shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${
                activeClient?.id === client.id ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-slate-200/80 hover:border-sky-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 font-black text-sm flex items-center justify-center">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-tight">{client.name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{formatPhone(client.phone)}</span>
                      </p>
                    </div>
                  </div>

                  {client.birthDay && (
                    <span className="inline-flex items-center gap-1 bg-pink-50 text-pink-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-pink-200">
                      <Cake className="w-3 h-3" />
                      <span>
                        {String(client.birthDay).padStart(2, '0')}/{String(client.birthMonth).padStart(2, '0')}
                      </span>
                    </span>
                  )}
                </div>

                {/* Vehicles list preview */}
                <div className="space-y-1.5 my-3 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Veículos do Cliente</span>
                  {clientVehs.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">Nenhum veículo cadastrado ainda.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {clientVehs.map((v) => (
                        <span
                          key={v.id}
                          className="inline-flex items-center gap-1 bg-slate-900 text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded-md"
                        >
                          <Car className="w-3 h-3 text-sky-400" />
                          <span>{v.plate}</span>
                          <span className="text-slate-400 font-sans font-normal text-[10px]">• {v.model}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                <span>{clientOrders.length} serviço(s) realizado(s)</span>
                <span className="text-sky-600 font-bold group-hover:underline flex items-center gap-1">
                  Ver Perfil Completo <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* CLIENT DETAILS DRAWER / MODAL */}
      {activeClient && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-sky-500 text-white font-black text-lg flex items-center justify-center">
                  {activeClient.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold">{activeClient.name}</h3>
                  <p className="text-xs text-sky-400">{formatPhone(activeClient.phone)}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveClient(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 flex-1">
              {/* WhatsApp Call Button */}
              <a
                href={buildWhatsAppUrl(
                  activeClient.whatsapp || activeClient.phone,
                  `Olá, ${activeClient.name}! Tudo bem? Aqui é da ${settings.name}. Como podemos ajudar com seu veículo hoje?`
                )}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chamar no WhatsApp ({formatPhone(activeClient.phone)})</span>
              </a>

              {/* Client Info Grid */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase">CPF / CNPJ</span>
                    <p className="font-semibold text-slate-800">{formatCpfCnpj(activeClient.cpfCnpj)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase">Aniversário</span>
                    <p className="font-semibold text-slate-800">
                      {activeClient.birthDay
                        ? `${String(activeClient.birthDay).padStart(2, '0')}/${String(
                            activeClient.birthMonth
                          ).padStart(2, '0')}`
                        : 'Não cadastrado'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Endereço</span>
                  <p className="font-semibold text-slate-800">
                    {activeClient.address
                      ? `${activeClient.address} - ${activeClient.city}/${activeClient.state}`
                      : 'Endereço não informado'}
                  </p>
                </div>

                {activeClient.notes && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-400 text-[10px] font-bold uppercase">Observações do Cliente</span>
                    <p className="text-slate-700 bg-white p-2 rounded-lg border border-slate-200 mt-1">
                      {activeClient.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* VEHICLES SECTION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-sky-600" />
                    <span>Veículos Vinculados</span>
                  </h4>
                  <button
                    onClick={() => setIsAddVehicleOpen(true)}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Adicionar Veículo</span>
                  </button>
                </div>

                {vehicles.filter((v) => v.clientId === activeClient.id).length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Nenhum veículo cadastrado para este cliente.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {vehicles
                      .filter((v) => v.clientId === activeClient.id)
                      .map((veh) => (
                        <div
                          key={veh.id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 bg-slate-900 text-white font-mono font-bold rounded-lg text-xs">
                              {veh.plate}
                            </span>
                            <div>
                              <h5 className="font-bold text-slate-900">
                                {veh.make} {veh.model} {veh.version} ({veh.year})
                              </h5>
                              <p className="text-[11px] text-slate-500">
                                Quilometragem: {veh.mileage.toLocaleString('pt-BR')} km
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => onOpenQuickAttendance(activeClient.id, veh.id)}
                            className="bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold px-3 py-1.5 rounded-lg border border-sky-200 text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>Novo Serviço</span>
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* SERVICE TIMELINE HISTORY */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-600" />
                  <span>Histórico de Serviços do Cliente</span>
                </h4>

                {workOrders.filter((w) => w.clientId === activeClient.id).length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Nenhum serviço realizado ainda.
                  </p>
                ) : (
                  <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                    {workOrders
                      .filter((w) => w.clientId === activeClient.id)
                      .map((order) => {
                        const veh = vehicles.find((v) => v.id === order.vehicleId);
                        return (
                          <div key={order.id} className="relative pl-8">
                            <div className="absolute left-1.5 top-1.5 w-4 h-4 rounded-full bg-sky-500 border-2 border-white shadow-xs"></div>
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900">{order.code}</span>
                                <span className="text-[11px] text-slate-500">{order.date}</span>
                              </div>
                              <p className="font-medium text-slate-700">
                                Veículo: <strong className="font-mono">{veh?.plate || '-'}</strong> ({veh?.model})
                              </p>
                              <div className="text-slate-600">
                                <strong>Itens:</strong> {order.items.map((i) => i.description).join(', ')}
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                                <span className="font-bold text-sky-700">{formatCurrency(order.totalAmount)}</span>
                                <span className="capitalize text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-bold">
                                  {order.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW CLIENT MODAL */}
      {isNewClientOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-sky-600" />
                <span>Cadastro de Novo Cliente</span>
              </h3>
              <button onClick={() => setIsNewClientOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClientSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Carlos Eduardo Silva"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value, whatsapp: e.target.value })
                    }
                    placeholder="(37) 99999-9999"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CPF ou CNPJ</label>
                  <input
                    type="text"
                    value={formData.cpfCnpj}
                    onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dia do Aniversário</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.birthDay || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, birthDay: e.target.value ? Number(e.target.value) : undefined })
                    }
                    placeholder="Ex: 15"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mês do Aniversário</label>
                  <select
                    value={formData.birthMonth || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, birthMonth: e.target.value ? Number(e.target.value) : undefined })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">Selecione o mês</option>
                    <option value="1">Janeiro</option>
                    <option value="2">Fevereiro</option>
                    <option value="3">Março</option>
                    <option value="4">Abril</option>
                    <option value="5">Maio</option>
                    <option value="6">Junho</option>
                    <option value="7">Julho</option>
                    <option value="8">Agosto</option>
                    <option value="9">Setembro</option>
                    <option value="10">Outubro</option>
                    <option value="11">Novembro</option>
                    <option value="12">Dezembro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Endereço</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, Número, Bairro"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observações Gerais</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Preferências do cliente..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewClientOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-xs"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD VEHICLE MODAL */}
      {isAddVehicleOpen && activeClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Car className="w-4 h-4 text-sky-600" />
                <span>Adicionar Veículo para {activeClient.name}</span>
              </h3>
              <button onClick={() => setIsAddVehicleOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVehicleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Placa do Veículo *</label>
                <input
                  type="text"
                  required
                  value={vehFormData.plate}
                  onChange={(e) => setVehFormData({ ...vehFormData, plate: normalizePlate(e.target.value) })}
                  placeholder="ABC1D23"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Marca</label>
                  <select
                    value={vehFormData.make}
                    onChange={(e) => setVehFormData({ ...vehFormData, make: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Chevrolet">Chevrolet</option>
                    <option value="Fiat">Fiat</option>
                    <option value="Volkswagen">Volkswagen</option>
                    <option value="Ford">Ford</option>
                    <option value="Toyota">Toyota</option>
                    <option value="Honda">Honda</option>
                    <option value="Hyundai">Hyundai</option>
                    <option value="Jeep">Jeep</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Modelo *</label>
                  <input
                    type="text"
                    required
                    value={vehFormData.model}
                    onChange={(e) => setVehFormData({ ...vehFormData, model: e.target.value })}
                    placeholder="Ex: Onix, Corolla"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ano</label>
                  <input
                    type="number"
                    value={vehFormData.year}
                    onChange={(e) => setVehFormData({ ...vehFormData, year: e.target.value })}
                    placeholder="2021"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quilometragem</label>
                  <input
                    type="number"
                    value={vehFormData.mileage}
                    onChange={(e) => setVehFormData({ ...vehFormData, mileage: e.target.value })}
                    placeholder="40000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddVehicleOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-xs"
                >
                  Salvar Veículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
