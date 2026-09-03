import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Cake,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Send,
  User,
  Car,
} from 'lucide-react';
import {
  getClients,
  getVehicles,
  getWorkOrders,
  getQuotes,
  getAccountsReceivable,
  getMaintenanceReminders,
  getFollowUps,
  getCompanySettings,
} from '../services/storage';
import { Client, Vehicle, WorkOrder, Quote, AccountsReceivable } from '../types';
import { formatPhone, buildWhatsAppUrl } from '../utils/formatters';

export const RelationshipView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<
    'birthdays' | 'reminders' | 'followups' | 'quotes' | 'cobrança'
  >('birthdays');

  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [receivables, setReceivables] = useState<AccountsReceivable[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);

  const loadData = () => {
    setClients(getClients());
    setVehicles(getVehicles());
    setWorkOrders(getWorkOrders());
    setQuotes(getQuotes());
    setReceivables(getAccountsReceivable());
    setReminders(getMaintenanceReminders());
    setFollowUps(getFollowUps());
  };

  useEffect(() => {
    loadData();
  }, []);

  const settings = getCompanySettings();

  // Helper to construct WhatsApp link with text replacing variables
  const getCustomWhatsAppLink = (
    phone: string,
    rawTemplate: string,
    variables: { name?: string; vehicle?: string; plate?: string; date?: string; amount?: string }
  ) => {
    let text = rawTemplate;
    text = text.replace(/\{NOME\}/g, variables.name || 'Cliente');
    text = text.replace(/\{VEICULO\}/g, variables.vehicle || 'seu veículo');
    text = text.replace(/\{PLACA\}/g, variables.plate || '');
    text = text.replace(/\{DATA\}/g, variables.date || '');
    text = text.replace(/\{EMPRESA\}/g, settings.name);
    text = text.replace(/\{VALOR\}/g, variables.amount || '');

    return buildWhatsAppUrl(phone, text);
  };

  // Calculations
  const todayDate = new Date();
  const currentMonth = todayDate.getMonth() + 1;

  const birthdayClients = clients.filter((c) => c.birthMonth === currentMonth);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-sky-600" />
            <span>Pós-Venda & Mensagens no WhatsApp</span>
          </h2>
          <p className="text-xs text-slate-500">
            Disparo inteligente de mensagens de aniversário, retornos de 6 meses e cobranças.
          </p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveCategory('birthdays')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeCategory === 'birthdays'
              ? 'bg-pink-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Cake className="w-4 h-4" />
          <span>Aniversariantes do Mês ({birthdayClients.length})</span>
        </button>

        <button
          onClick={() => setActiveCategory('followups')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeCategory === 'followups'
              ? 'bg-sky-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Pós-Atendimento (3 Dias) ({followUps.length})</span>
        </button>

        <button
          onClick={() => setActiveCategory('reminders')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeCategory === 'reminders'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Retornos de 6 Meses ({reminders.length})</span>
        </button>

        <button
          onClick={() => setActiveCategory('cobrança')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeCategory === 'cobrança'
              ? 'bg-purple-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Cobranças Pendentes ({receivables.length})</span>
        </button>
      </div>

      {/* CATEGORY 1: BIRTHDAYS */}
      {activeCategory === 'birthdays' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Aniversariantes do Mês Atual ({currentMonth})
          </h3>

          {birthdayClients.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">
              Nenhum aniversariante cadastrado para este mês.
            </p>
          ) : (
            <div className="space-y-3">
              {birthdayClients.map((client) => (
                <div
                  key={client.id}
                  className="p-4 rounded-xl border border-pink-100 bg-pink-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center font-bold">
                      <Cake className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{client.name}</h4>
                      <p className="text-xs text-slate-500">
                        Dia {String(client.birthDay).padStart(2, '0')} • WhatsApp: {formatPhone(client.phone)}
                      </p>
                    </div>
                  </div>

                  <a
                    href={getCustomWhatsAppLink(client.phone, settings.birthdayMsgTemplate, {
                      name: client.name,
                    })}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Parabéns no WhatsApp</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CATEGORY 2: PÓS-ATENDIMENTO (3 DIAS) */}
      {activeCategory === 'followups' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Acompanhamento de Satisfação (3 Dias Após o Serviço)
          </h3>

          <div className="space-y-3">
            {followUps.map((fol) => {
              const client = clients.find((c) => c.id === fol.clientId);
              if (!client) return null;

              return (
                <div
                  key={fol.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{client.name}</h4>
                      <p className="text-xs text-slate-500">Data do Serviço: {fol.date}</p>
                    </div>
                  </div>

                  <a
                    href={getCustomWhatsAppLink(client.phone, settings.followUpMsgTemplate, {
                      name: client.name,
                    })}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Perguntar se Ar Ficou Gelando</span>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CATEGORY 3: MAINTENANCE REMINDERS (6 MONTHS) */}
      {activeCategory === 'reminders' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Lembretes de Higienização e Manutenção Preventiva (6 Meses)
          </h3>

          <div className="space-y-3">
            {reminders.map((rem) => {
              const client = clients.find((c) => c.id === rem.clientId);
              const vehicle = vehicles.find((v) => v.id === rem.vehicleId);
              if (!client) return null;

              return (
                <div
                  key={rem.id}
                  className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{client.name}</h4>
                      <p className="text-xs text-slate-500">
                        Veículo: {vehicle?.model} ({vehicle?.plate}) • Vencimento: {rem.dueDate}
                      </p>
                    </div>
                  </div>

                  <a
                    href={getCustomWhatsAppLink(client.phone, settings.maintenanceMsgTemplate, {
                      name: client.name,
                      vehicle: vehicle?.model,
                      plate: vehicle?.plate,
                    })}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Lembrar Retorno no WhatsApp</span>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CATEGORY 4: COBRANÇA */}
      {activeCategory === 'cobrança' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Aviso Amigável de Cobrança / Parcelamento
          </h3>

          <div className="space-y-3">
            {receivables.map((rec) => {
              const client = clients.find((c) => c.id === rec.clientId);
              if (!client) return null;

              return (
                <div
                  key={rec.id}
                  className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{client.name}</h4>
                      <p className="text-xs text-slate-500">
                        Total Parcelado: {rec.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                  </div>

                  <a
                    href={getCustomWhatsAppLink(client.phone, settings.duePaymentMsgTemplate, {
                      name: client.name,
                    })}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Lembrete de Pagamento</span>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
