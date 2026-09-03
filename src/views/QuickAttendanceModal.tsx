import React, { useState, useEffect } from 'react';
import { X, Search, Car, User, CheckCircle2, ArrowRight, Wrench, ShieldCheck, Plus } from 'lucide-react';
import { getClients, getVehicles, saveClient, saveVehicle, getServiceCatalog, saveWorkOrder } from '../services/storage';
import { Client, Vehicle, ServiceCatalog } from '../types';
import { formatPhone, normalizePlate, formatCurrency } from '../utils/formatters';

interface QuickAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkOrderCreated: (workOrderId: string) => void;
  initialClientId?: string;
  initialVehicleId?: string;
}

export const QuickAttendanceModal: React.FC<QuickAttendanceModalProps> = ({
  isOpen,
  onClose,
  onWorkOrderCreated,
  initialClientId,
  initialVehicleId,
}) => {
  const [step, setStep] = useState<'search' | 'quick_register' | 'select_service'>('search');
  const [query, setQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Quick Register Form State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPlate, setRegPlate] = useState('');
  const [regMake, setRegMake] = useState('Chevrolet');
  const [regModel, setRegModel] = useState('');
  const [regYear, setRegYear] = useState('2021');

  // Service Selection State
  const [services, setServices] = useState<ServiceCatalog[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [mileage, setMileage] = useState('45000');
  const [complaint, setComplaint] = useState('');

  useEffect(() => {
    if (isOpen) {
      const allClients = getClients();
      const allVehicles = getVehicles();
      const c = initialClientId ? allClients.find((x) => x.id === initialClientId) : null;
      const v = initialVehicleId ? allVehicles.find((x) => x.id === initialVehicleId) : null;

      if (c) {
        setSelectedClient(c);
        if (v) {
          setSelectedVehicle(v);
        } else {
          const clientVehicles = allVehicles.filter((x) => x.clientId === c.id);
          if (clientVehicles.length > 0) setSelectedVehicle(clientVehicles[0]);
        }
        setStep('select_service');
      } else {
        setStep('search');
        setSelectedClient(null);
        setSelectedVehicle(null);
      }

      setQuery('');
      setSelectedServices([]);
      setComplaint('');
      setServices(getServiceCatalog());
    }
  }, [isOpen, initialClientId, initialVehicleId]);

  if (!isOpen) return null;

  const handleSearch = () => {
    const term = query.trim();
    if (!term) return;

    const clean = term.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const allVehicles = getVehicles();
    const allClients = getClients();

    // Match vehicle plate
    const matchedVehicle = allVehicles.find((v) => v.plate === clean || v.plate.includes(clean));
    if (matchedVehicle) {
      const matchedClient = allClients.find((c) => c.id === matchedVehicle.clientId);
      if (matchedClient) {
        setSelectedClient(matchedClient);
        setSelectedVehicle(matchedVehicle);
        setStep('select_service');
        return;
      }
    }

    // Match client phone or name
    const matchedClient = allClients.find(
      (c) => c.phone.replace(/\D/g, '').includes(clean) || c.name.toLowerCase().includes(term.toLowerCase())
    );
    if (matchedClient) {
      const clientVehicles = allVehicles.filter((v) => v.clientId === matchedClient.id);
      setSelectedClient(matchedClient);
      if (clientVehicles.length > 0) {
        setSelectedVehicle(clientVehicles[0]);
      }
      setStep('select_service');
      return;
    }

    // If not found, prefill quick register
    if (clean.length >= 7 && /^[A-Z0-9]+$/.test(clean)) {
      setRegPlate(clean);
    } else {
      setRegName(term);
    }
    setStep('quick_register');
  };

  const handleQuickRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regPhone || !regPlate || !regModel) return;

    const client = saveClient({
      name: regName,
      phone: regPhone,
      whatsapp: regPhone,
    });

    const vehicle = saveVehicle({
      clientId: client.id,
      plate: regPlate,
      make: regMake,
      model: regModel,
      year: Number(regYear) || 2021,
      mileage: Number(mileage) || 0,
    });

    setSelectedClient(client);
    setSelectedVehicle(vehicle);
    setStep('select_service');
  };

  const toggleService = (srvId: string) => {
    if (selectedServices.includes(srvId)) {
      setSelectedServices(selectedServices.filter((id) => id !== srvId));
    } else {
      setSelectedServices([...selectedServices, srvId]);
    }
  };

  const handleCreateWorkOrder = () => {
    if (!selectedClient || !selectedVehicle) return;

    const items = selectedServices.map((srvId) => {
      const srv = services.find((s) => s.id === srvId);
      return {
        id: 'item_' + Date.now() + Math.random(),
        type: 'servico' as const,
        refId: srvId,
        description: srv ? srv.name : 'Serviço de Ar-Condicionado',
        quantity: 1,
        unitPrice: srv ? srv.defaultPrice : 150,
        totalPrice: srv ? srv.defaultPrice : 150,
      };
    });

    const total = items.reduce((sum, item) => sum + item.totalPrice, 0);

    const wo = saveWorkOrder({
      clientId: selectedClient.id,
      vehicleId: selectedVehicle.id,
      mileage: Number(mileage) || selectedVehicle.mileage,
      clientComplaint: complaint || 'Revisão e manutenção de ar-condicionado.',
      items,
      laborCost: 0,
      discount: 0,
      totalAmount: total,
      paymentMethod: 'pix',
      status: 'aberto',
      warrantyDays: 90,
    });

    onWorkOrderCreated(wo.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
              1-2-3
            </div>
            <div>
              <h3 className="text-sm font-bold">Atendimento Rápido de Oficina</h3>
              <p className="text-[11px] text-sky-400">Vinícius Ar-Condicionado Automotivo</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-3 bg-slate-100 text-[11px] font-bold text-center border-b border-slate-200">
          <div className={`py-2 ${step === 'search' ? 'bg-sky-50 text-sky-700 border-b-2 border-sky-600' : 'text-slate-500'}`}>
            1. Placa ou Tel
          </div>
          <div
            className={`py-2 ${
              step === 'quick_register' ? 'bg-sky-50 text-sky-700 border-b-2 border-sky-600' : 'text-slate-500'
            }`}
          >
            2. Cadastro
          </div>
          <div className={`py-2 ${step === 'select_service' ? 'bg-sky-50 text-sky-700 border-b-2 border-sky-600' : 'text-slate-500'}`}>
            3. Serviço
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5">
          {/* STEP 1: SEARCH */}
          {step === 'search' && (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-800">
                Digite a Placa do Veículo ou Telefone do Cliente:
              </label>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Ex: ABC1D23 ou (37) 99888-7766"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold uppercase text-slate-900 placeholder:normal-case placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
                <button
                  onClick={handleSearch}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <span>Buscar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-xs text-sky-800 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" />
                <p>
                  Se a placa ou cliente já existirem, os dados serão carregados instantaneamente. Caso contrário, faremos um
                  cadastro relâmpago de apenas 2 passos.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: QUICK REGISTER */}
          {step === 'quick_register' && (
            <form onSubmit={handleQuickRegisterSubmit} className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium">
                Veículo ou cliente não localizados. Preencha o cadastro rápido de recepção:
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nome do Cliente *</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">WhatsApp / Telefone *</label>
                  <input
                    type="text"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="(37) 99999-9999"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Placa *</label>
                  <input
                    type="text"
                    required
                    value={regPlate}
                    onChange={(e) => setRegPlate(normalizePlate(e.target.value))}
                    placeholder="ABC1D23"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Marca</label>
                  <select
                    value={regMake}
                    onChange={(e) => setRegMake(e.target.value)}
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
                    <option value="Nissan">Nissan</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Modelo *</label>
                  <input
                    type="text"
                    required
                    value={regModel}
                    onChange={(e) => setRegModel(e.target.value)}
                    placeholder="Ex: Onix, Corolla"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep('search')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SELECT SERVICE */}
          {step === 'select_service' && selectedClient && (
            <div className="space-y-4">
              {/* Selected Target Summary */}
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-500 text-white font-bold flex items-center justify-center text-xs">
                    {selectedClient.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{selectedClient.name}</h4>
                    <p className="text-[11px] text-slate-500">{formatPhone(selectedClient.phone)}</p>
                  </div>
                </div>
                {selectedVehicle && (
                  <div className="text-right">
                    <span className="font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded text-[11px]">
                      {selectedVehicle.plate}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {selectedVehicle.make} {selectedVehicle.model}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Qual serviço será realizado?</label>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {services.map((srv) => {
                    const isChecked = selectedServices.includes(srv.id);
                    return (
                      <div
                        key={srv.id}
                        onClick={() => toggleService(srv.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                          isChecked
                            ? 'bg-sky-50 border-sky-500 text-sky-900 font-bold'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                              isChecked ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                          <span>{srv.name}</span>
                        </div>
                        <span className="font-bold text-slate-900">{formatCurrency(srv.defaultPrice)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Quilometragem Atual</label>
                  <input
                    type="number"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    placeholder="45000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Queixa do Cliente / Obs</label>
                  <input
                    type="text"
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    placeholder="Ex: Ar fraco ou cheiro ruim"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <button
                  onClick={() => setStep('search')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Voltar
                </button>
                <button
                  onClick={handleCreateWorkOrder}
                  disabled={selectedServices.length === 0}
                  className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Gerar Ordem de Serviço</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
