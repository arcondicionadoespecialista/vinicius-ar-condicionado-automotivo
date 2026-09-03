import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  MessageSquare,
  RefreshCw,
  Save,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  Key,
} from 'lucide-react';
import {
  getCompanySettings,
  saveCompanySettings,
  seedInitialData,
  getAuthenticatedUser,
} from '../services/storage';
import { CompanySettings } from '../types';
import { UserManagement } from '../components/UserManagement';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<CompanySettings>(getCompanySettings());
  const [currentUser] = useState(() => getAuthenticatedUser());
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setSettings(getCompanySettings());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveCompanySettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDemo = () => {
    if (
      window.confirm(
        'Tem certeza que deseja restaurar os dados de demonstração? Isso irá resetar todas as alterações recentes.'
      )
    ) {
      seedInitialData(true);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-600" />
            <span>Configurações da Oficina & Modelos de Mensagem</span>
          </h2>
          <p className="text-xs text-slate-500">
            Personalize os dados impressos nos comprovantes não fiscais e as mensagens automáticas.
          </p>
        </div>

        {savedSuccess && (
          <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200 animate-pulse">
            <CheckCircle2 className="w-4 h-4" />
            <span>Configurações Salvas com Sucesso!</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* WORKSHOP PROFILE */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="w-4 h-4 text-sky-600" />
            <span>Perfil da Empresa (Dados dos Comprovantes)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nome da Oficina / Razão Social</label>
              <input
                type="text"
                required
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">CNPJ / CPF</label>
              <input
                type="text"
                value={settings.cnpjCpf}
                onChange={(e) => setSettings({ ...settings, cnpjCpf: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">WhatsApp da Oficina</label>
              <input
                type="text"
                value={settings.whatsapp}
                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Cidade / Estado</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={settings.city}
                  onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                  className="col-span-2 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
                <input
                  type="text"
                  value={settings.state}
                  onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium uppercase text-center"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Endereço Completo</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Texto de Rodapé dos Comprovantes Não Fiscais</label>
              <textarea
                rows={2}
                value={settings.footerText}
                onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              />
            </div>
          </div>
        </div>

        {/* WHATSAPP TEMPLATES */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-sky-600" />
              <span>Modelos de Mensagem do WhatsApp</span>
            </h3>
            <span className="text-[10px] bg-slate-100 font-bold px-2.5 py-1 rounded-lg text-slate-600">
              Variáveis: {'{NOME}'}, {'{VEICULO}'}, {'{PLACA}'}, {'{EMPRESA}'}
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Mensagem de Aniversário</label>
              <textarea
                rows={2}
                value={settings.birthdayMsgTemplate}
                onChange={(e) => setSettings({ ...settings, birthdayMsgTemplate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Mensagem de Pós-Atendimento (3 Dias)</label>
              <textarea
                rows={2}
                value={settings.followUpMsgTemplate}
                onChange={(e) => setSettings({ ...settings, followUpMsgTemplate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Mensagem de Lembrete de Higienização (6 Meses)
              </label>
              <textarea
                rows={2}
                value={settings.maintenanceMsgTemplate}
                onChange={(e) => setSettings({ ...settings, maintenanceMsgTemplate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Mensagem de Cobrança Educada</label>
              <textarea
                rows={2}
                value={settings.duePaymentMsgTemplate}
                onChange={(e) => setSettings({ ...settings, duePaymentMsgTemplate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              />
            </div>
          </div>
        </div>

        {/* SAVE & RESET ACTIONS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleResetDemo}
            className="w-full sm:w-auto bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-rose-600" />
            <span>Restaurar Dados de Demonstração</span>
          </button>

          <button
            type="submit"
            className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Dados da Oficina</span>
          </button>
        </div>
      </form>

      {/* USERS & PERMISSIONS MANAGEMENT (ADMIN) - Standalone section */}
      <UserManagement currentUser={currentUser} />
    </div>
  );
};
