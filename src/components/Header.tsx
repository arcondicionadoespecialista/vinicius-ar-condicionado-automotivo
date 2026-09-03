import React, { useState } from 'react';
import { Search, Plus, Wrench, ShieldCheck } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { GlobalSearchModal } from './GlobalSearchModal';

interface HeaderProps {
  onOpenQuickAttendance: () => void;
  onSelectClient: (clientId: string) => void;
  onSelectVehicle: (vehicleId: string) => void;
  currentTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenQuickAttendance,
  onSelectClient,
  onSelectVehicle,
  currentTitle = 'Dashboard Geral',
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 md:pl-68 flex items-center justify-between gap-3 shadow-xs">
        {/* Left Title / Branding */}
        <div className="flex items-center gap-3">
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
              AR
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">{currentTitle}</h2>
            <p className="hidden sm:block text-[11px] text-slate-500">Vinícius Ar-Condicionado Automotivo</p>
          </div>
        </div>

        {/* Center Search Trigger Bar */}
        <div className="flex-1 max-w-md">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 hover:border-sky-400 hover:bg-slate-50 text-slate-500 text-xs text-left transition-all cursor-pointer shadow-2xs"
          >
            <Search className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
            <span className="truncate">Buscar placa (ex: ABC1D23), cliente ou telefone...</span>
            <kbd className="hidden sm:inline-block ml-auto text-[10px] bg-white text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2">
          <PWAInstallButton />

          <button
            onClick={onOpenQuickAttendance}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            title="Iniciar atendimento rápido de cliente ou placa"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Atendimento</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>
      </header>

      {/* Global Search Modal Overlay */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectClient={onSelectClient}
        onSelectVehicle={onSelectVehicle}
      />
    </>
  );
};
