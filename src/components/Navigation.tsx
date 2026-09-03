import React from 'react';
import {
  LayoutDashboard,
  Users,
  Car,
  Wrench,
  DollarSign,
  Package,
  MessageSquareHeart,
  BarChart3,
  Settings,
  PlusCircle,
  FileText,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { User, SystemModule } from '../types';
import { hasModuleAccess } from '../services/storage';

export type ActiveTab =
  | 'dashboard'
  | 'clients'
  | 'vehicles'
  | 'work_orders'
  | 'quotes'
  | 'finance'
  | 'stock'
  | 'relationship'
  | 'reports'
  | 'settings';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenQuickAttendance: () => void;
  unreadAlertsCount?: number;
  currentUser?: User | null;
  onLogout?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickAttendance,
  unreadAlertsCount = 0,
  currentUser,
  onLogout,
}) => {
  const allNavItems = [
    { id: 'dashboard' as ActiveTab, label: 'Início', icon: LayoutDashboard },
    { id: 'clients' as ActiveTab, label: 'Clientes', icon: Users },
    { id: 'vehicles' as ActiveTab, label: 'Veículos', icon: Car },
    { id: 'work_orders' as ActiveTab, label: 'Serviços & O.S.', icon: Wrench },
    { id: 'quotes' as ActiveTab, label: 'Orçamentos', icon: FileText },
    { id: 'finance' as ActiveTab, label: 'Financeiro', icon: DollarSign },
    { id: 'stock' as ActiveTab, label: 'Estoque', icon: Package },
    {
      id: 'relationship' as ActiveTab,
      label: 'Relacionamento',
      icon: MessageSquareHeart,
      badge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined,
    },
    { id: 'reports' as ActiveTab, label: 'Relatórios', icon: BarChart3 },
    { id: 'settings' as ActiveTab, label: 'Configurações', icon: Settings },
  ];

  // Filter navigation items by authenticated user permissions
  const mainNavItems = allNavItems.filter((item) =>
    hasModuleAccess(currentUser, item.id as SystemModule)
  );

  return (
    <>
      {/* DESKTOP / TABLET SIDEBAR */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 bg-slate-900 border-r border-slate-800 text-slate-300">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white font-black text-xl shadow-md">
              AR
            </div>
            <div>
              <h1 className="font-bold text-sm text-white leading-tight">Vinícius AR</h1>
              <p className="text-[11px] text-sky-400 font-medium">Ar-Condicionado Automotivo</p>
            </div>
          </div>
        </div>

        {/* Quick New Attendance Action */}
        <div className="p-4">
          <button
            onClick={onOpenQuickAttendance}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-900/40 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Novo Atendimento</span>
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 font-bold border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-xs flex-shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {currentUser?.name || 'Administrador'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {currentUser?.email || 'admin'}
                </p>
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Sair do Sistema"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-500 flex justify-between items-center px-1">
            <span>v2.5</span>
            <span className="flex items-center gap-1.5 text-emerald-400 text-[10px]">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Conectado
            </span>
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1 flex items-center justify-around text-slate-400 text-[10px]">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
            activeTab === 'dashboard' ? 'text-sky-400 font-bold' : 'hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Início</span>
        </button>

        <button
          onClick={() => setActiveTab('clients')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
            activeTab === 'clients' ? 'text-sky-400 font-bold' : 'hover:text-slate-200'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span>Clientes</span>
        </button>

        {/* Center Prominent Quick Action Button */}
        <button
          onClick={onOpenQuickAttendance}
          className="flex flex-col items-center -mt-5 bg-gradient-to-tr from-sky-600 to-cyan-500 text-white p-3 rounded-full shadow-lg shadow-sky-900/50 border-2 border-slate-900 active:scale-95 transition-transform"
          title="Novo Atendimento Rápido"
        >
          <PlusCircle className="w-6 h-6" />
        </button>

        <button
          onClick={() => setActiveTab('work_orders')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
            activeTab === 'work_orders' ? 'text-sky-400 font-bold' : 'hover:text-slate-200'
          }`}
        >
          <Wrench className="w-5 h-5 mb-0.5" />
          <span>O.S.</span>
        </button>

        <button
          onClick={() => setActiveTab('relationship')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg relative transition-colors ${
            activeTab === 'relationship' ? 'text-sky-400 font-bold' : 'hover:text-slate-200'
          }`}
        >
          <MessageSquareHeart className="w-5 h-5 mb-0.5" />
          <span>Contato</span>
          {unreadAlertsCount > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>
      </nav>
    </>
  );
};
