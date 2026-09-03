import React, { useState, useEffect } from 'react';
import { Search, X, Car, User, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import { getClients, getVehicles } from '../services/storage';
import { Client, Vehicle } from '../types';
import { formatPhone, formatCpfCnpj } from '../utils/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClient: (clientId: string) => void;
  onSelectVehicle: (vehicleId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectClient,
  onSelectVehicle,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    if (isOpen) {
      setClients(getClients());
      setVehicles(getVehicles());
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const term = searchTerm.trim().toLowerCase();
  const cleanTerm = term.replace(/[^a-zA-Z0-9]/g, '');

  const filteredVehicles = term
    ? vehicles.filter(
        (v) =>
          v.plate.toLowerCase().includes(cleanTerm) ||
          v.model.toLowerCase().includes(term) ||
          v.make.toLowerCase().includes(term)
      )
    : [];

  const filteredClients = term
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.phone.replace(/\D/g, '').includes(cleanTerm) ||
          (c.cpfCnpj && c.cpfCnpj.replace(/\D/g, '').includes(cleanTerm))
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-sky-600 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Digite a placa (ex: ABC1D23), nome do cliente, telefone ou CPF..."
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-200/60 rounded-lg"
          >
            Esc
          </button>
        </div>

        {/* Results Area */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-5">
          {!term && (
            <div className="text-center py-8 text-slate-400 text-xs">
              <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-medium text-slate-600">Busca Rápida na Oficina</p>
              <p className="text-[11px] mt-1 text-slate-400">
                Pesquise por placa do carro para ver o prontuário completo ou por nome de cliente.
              </p>
            </div>
          )}

          {term && filteredVehicles.length === 0 && filteredClients.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              <p className="font-semibold text-slate-700">Nenhum resultado encontrado para "{searchTerm}"</p>
              <p className="text-[11px] mt-1 text-slate-400">Verifique a digitação da placa ou telefone.</p>
            </div>
          )}

          {/* Vehicle Results */}
          {filteredVehicles.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-sky-600" />
                <span>Veículos Encontrados ({filteredVehicles.length})</span>
              </div>
              <div className="space-y-2">
                {filteredVehicles.map((veh) => {
                  const owner = clients.find((c) => c.id === veh.clientId);
                  return (
                    <div
                      key={veh.id}
                      onClick={() => {
                        onSelectVehicle(veh.id);
                        onClose();
                      }}
                      className="p-3 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs shadow-xs border border-slate-700">
                          {veh.plate}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">
                            {veh.make} {veh.model} {veh.version} ({veh.year})
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Dono: {owner ? owner.name : 'Cliente não informado'} • {veh.mileage.toLocaleString('pt-BR')} km
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Client Results */}
          {filteredClients.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-600" />
                <span>Clientes Encontrados ({filteredClients.length})</span>
              </div>
              <div className="space-y-2">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => {
                      onSelectClient(client.id);
                      onClose();
                    }}
                    className="p-3 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{client.name}</h4>
                        <p className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>{formatPhone(client.phone)}</span>
                          {client.cpfCnpj && <span>• CPF: {formatCpfCnpj(client.cpfCnpj)}</span>}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between px-4">
          <span className="flex items-center gap-1 text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Vinícius AR • Prontuário Rápido
          </span>
          <span>Dica: Digite apenas a placa para ver o histórico do veículo</span>
        </div>
      </div>
    </div>
  );
};
