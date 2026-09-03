import React, { useState, useEffect } from 'react';
import {
  Car,
  Search,
  Plus,
  Wrench,
  Clock,
  ShieldCheck,
  User,
  DollarSign,
  AlertCircle,
  X,
  FileText,
} from 'lucide-react';
import {
  getVehicles,
  getClients,
  getWorkOrders,
  saveVehicle,
} from '../services/storage';
import { Vehicle, Client, WorkOrder } from '../types';
import { formatPhone, formatCurrency, normalizePlate } from '../utils/formatters';

interface VehiclesViewProps {
  onOpenQuickAttendance: (clientId?: string, vehicleId?: string) => void;
  selectedVehicleId?: string | null;
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({
  onOpenQuickAttendance,
  selectedVehicleId,
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null);

  const loadData = () => {
    const loadedVehicles = getVehicles();
    setVehicles(loadedVehicles);
    setClients(getClients());
    setWorkOrders(getWorkOrders());

    if (selectedVehicleId) {
      const found = loadedVehicles.find((v) => v.id === selectedVehicleId);
      if (found) setActiveVehicle(found);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedVehicleId]);

  const term = searchTerm.trim().toLowerCase();
  const cleanTerm = term.replace(/[^a-zA-Z0-9]/g, '');

  const filteredVehicles = vehicles.filter((v) => {
    if (!term) return true;
    const owner = clients.find((c) => c.id === v.clientId);
    return (
      v.plate.toLowerCase().includes(cleanTerm) ||
      v.model.toLowerCase().includes(term) ||
      v.make.toLowerCase().includes(term) ||
      (owner && owner.name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Car className="w-5 h-5 text-sky-600" />
            <span>Prontuário de Veículos ({vehicles.length})</span>
          </h2>
          <p className="text-xs text-slate-500">Histórico completo de manutenção de cada carro atendido.</p>
        </div>

        <button
          onClick={onOpenQuickAttendance}
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Veículo / Atendimento</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar por placa (ex: ABC1D23), modelo, marca ou nome do proprietário..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
      </div>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVehicles.map((vehicle) => {
          const owner = clients.find((c) => c.id === vehicle.clientId);
          const vehOrders = workOrders.filter((w) => w.vehicleId === vehicle.id);
          const totalSpent = vehOrders.reduce((sum, w) => sum + w.totalAmount, 0);

          return (
            <div
              key={vehicle.id}
              onClick={() => setActiveVehicle(vehicle)}
              className={`p-4 rounded-2xl border bg-white shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${
                activeVehicle?.id === vehicle.id ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-slate-200/80 hover:border-sky-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 bg-slate-900 text-white font-mono font-bold text-xs rounded-xl shadow-xs border border-slate-700">
                      {vehicle.plate}
                    </span>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-tight">
                        {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="text-[11px] text-slate-500">Ano {vehicle.year}</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-700 my-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-bold uppercase">Proprietário</span>
                    <span className="font-bold text-slate-900">{owner ? owner.name : 'Não informado'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-bold uppercase">Quilometragem</span>
                    <span className="font-bold text-slate-900">{vehicle.mileage.toLocaleString('pt-BR')} km</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-bold uppercase">Total Investido</span>
                    <span className="font-bold text-sky-700">{formatCurrency(totalSpent)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                <span className="text-slate-500">{vehOrders.length} serviço(s) registrado(s)</span>
                <span className="text-sky-600 font-bold">Ver Prontuário →</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* VEHICLE HISTORY DRAWER / PRONTUÁRIO */}
      {activeVehicle && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-sky-500 text-white font-mono font-bold text-sm rounded-xl">
                  {activeVehicle.plate}
                </span>
                <div>
                  <h3 className="text-base font-bold">
                    {activeVehicle.make} {activeVehicle.model} {activeVehicle.version}
                  </h3>
                  <p className="text-xs text-sky-400">Prontuário Técnico do Veículo</p>
                </div>
              </div>
              <button
                onClick={() => setActiveVehicle(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 space-y-6 flex-1">
              {/* Vehicle Quick Summary Card */}
              {(() => {
                const owner = clients.find((c) => c.id === activeVehicle.clientId);
                const vehOrders = workOrders.filter((w) => w.vehicleId === activeVehicle.id);
                const totalSpent = vehOrders.reduce((sum, w) => sum + w.totalAmount, 0);
                const lastOrder = vehOrders[0];

                return (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase">Proprietário</span>
                        <p className="font-bold text-slate-900 truncate">{owner ? owner.name : '-'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase">WhatsApp</span>
                        <p className="font-bold text-slate-900">{owner ? formatPhone(owner.phone) : '-'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase">Última KM</span>
                        <p className="font-bold text-slate-900">{activeVehicle.mileage.toLocaleString('pt-BR')} km</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase">Total Gasto</span>
                        <p className="font-bold text-sky-700">{formatCurrency(totalSpent)}</p>
                      </div>
                    </div>

                    {lastOrder?.nextReturnDate && (
                      <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-600" />
                          Próxima Manutenção Recomendada:
                        </span>
                        <span className="font-bold bg-amber-200/80 px-2.5 py-0.5 rounded-lg text-amber-950">
                          {lastOrder.nextReturnDate}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* SERVICE TIMELINE */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-sky-600" />
                    <span>Linha do Tempo dos Atendimentos</span>
                  </h4>
                  <button
                    onClick={() => onOpenQuickAttendance(activeVehicle.clientId, activeVehicle.id)}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs cursor-pointer"
                  >
                    + Registrar Novo Atendimento
                  </button>
                </div>

                {workOrders.filter((w) => w.vehicleId === activeVehicle.id).length === 0 ? (
                  <p className="text-xs text-slate-400 p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    Nenhum serviço registrado para este veículo ainda.
                  </p>
                ) : (
                  <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                    {workOrders
                      .filter((w) => w.vehicleId === activeVehicle.id)
                      .map((order) => (
                        <div key={order.id} className="relative pl-8">
                          <div className="absolute left-1.5 top-2 w-4 h-4 rounded-full bg-sky-600 border-2 border-white shadow-xs"></div>
                          <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2 text-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{order.code}</span>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-500 font-medium">{order.date}</span>
                              </div>
                              <span className="font-bold text-sky-700 text-sm">{formatCurrency(order.totalAmount)}</span>
                            </div>

                            {order.clientComplaint && (
                              <div>
                                <span className="text-slate-400 text-[10px] font-bold uppercase">Queixa do Cliente:</span>
                                <p className="text-slate-700 font-medium">{order.clientComplaint}</p>
                              </div>
                            )}

                            {order.diagnosis && (
                              <div>
                                <span className="text-slate-400 text-[10px] font-bold uppercase">Diagnóstico Técnico:</span>
                                <p className="text-slate-700">{order.diagnosis}</p>
                              </div>
                            )}

                            <div className="bg-slate-50 p-2.5 rounded-xl space-y-1">
                              <span className="text-slate-400 text-[10px] font-bold uppercase">Serviços e Peças Executados:</span>
                              <ul className="list-disc list-inside space-y-0.5 text-slate-800">
                                {order.items.map((item) => (
                                  <li key={item.id} className="font-medium">
                                    {item.description} ({item.quantity}x) — {formatCurrency(item.totalPrice)}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                              <span>Garantia: {order.warrantyDays} dias</span>
                              <span>KM no serviço: {order.mileage.toLocaleString('pt-BR')} km</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
