import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation, ActiveTab } from './components/Navigation';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { QuickAttendanceModal } from './views/QuickAttendanceModal';
import { LoginView } from './views/LoginView';

import { DashboardView } from './views/DashboardView';
import { ClientsView } from './views/ClientsView';
import { VehiclesView } from './views/VehiclesView';
import { WorkOrdersView } from './views/WorkOrdersView';
import { QuotesView } from './views/QuotesView';
import { FinanceView } from './views/FinanceView';
import { StockView } from './views/StockView';
import { RelationshipView } from './views/RelationshipView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';

import { seedInitialData, getAuthenticatedUser, logoutUser } from './services/storage';
import { User } from './types';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getAuthenticatedUser());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Global Modals State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickAttendanceOpen, setIsQuickAttendanceOpen] = useState(false);
  const [quickAttendanceInitial, setQuickAttendanceInitial] = useState<{
    clientId?: string;
    vehicleId?: string;
  }>({});

  // Cross-view selection hooks
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [, setStorageVersion] = useState(0);

  useEffect(() => {
    // Seed and fetch Supabase data on mount
    seedInitialData();

    const handleStorageUpdate = () => {
      setStorageVersion((v) => v + 1);
      setCurrentUser(getAuthenticatedUser());
    };

    window.addEventListener('storage_updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('storage_updated', handleStorageUpdate);
    };
  }, []);

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setActiveTab('clients');
  };

  const handleSelectVehicle = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setActiveTab('vehicles');
  };

  const handleOpenQuickAttendance = (clientId?: string, vehicleId?: string) => {
    setQuickAttendanceInitial({ clientId, vehicleId });
    setIsQuickAttendanceOpen(true);
  };

  // If not authenticated, show initial authentication screen
  if (!currentUser) {
    return <LoginView onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased flex flex-col md:flex-row">
      {/* Sidebar Navigation (Desktop) / Bottom Nav (Mobile) */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickAttendance={() => handleOpenQuickAttendance()}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        {/* Header */}
        <Header
          onOpenQuickAttendance={() => handleOpenQuickAttendance()}
          onSelectClient={handleSelectClient}
          onSelectVehicle={handleSelectVehicle}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* View Switcher Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              setActiveTab={setActiveTab}
              onOpenQuickAttendance={() => handleOpenQuickAttendance()}
              onSelectClient={handleSelectClient}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'clients' && (
            <ClientsView
              onOpenQuickAttendance={(clientId, vehicleId) =>
                handleOpenQuickAttendance(clientId, vehicleId)
              }
              selectedClientId={selectedClientId}
            />
          )}

          {activeTab === 'vehicles' && (
            <VehiclesView
              onOpenQuickAttendance={(clientId, vehicleId) =>
                handleOpenQuickAttendance(clientId, vehicleId)
              }
              selectedVehicleId={selectedVehicleId}
            />
          )}

          {activeTab === 'work_orders' && (
            <WorkOrdersView
              onOpenQuickAttendance={() => handleOpenQuickAttendance()}
            />
          )}

          {activeTab === 'quotes' && (
            <QuotesView
              onWorkOrderCreated={() => {
                setActiveTab('work_orders');
              }}
            />
          )}

          {activeTab === 'finance' && <FinanceView currentUser={currentUser} />}

          {activeTab === 'stock' && <StockView />}

          {activeTab === 'relationship' && <RelationshipView />}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Search Modal */}
      {isSearchOpen && (
        <GlobalSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSelectClient={handleSelectClient}
          onSelectVehicle={handleSelectVehicle}
        />
      )}

      {/* Quick Attendance Modal */}
      {isQuickAttendanceOpen && (
        <QuickAttendanceModal
          isOpen={isQuickAttendanceOpen}
          onClose={() => setIsQuickAttendanceOpen(false)}
          onWorkOrderCreated={() => {
            setIsQuickAttendanceOpen(false);
            setActiveTab('work_orders');
          }}
          initialClientId={quickAttendanceInitial.clientId}
          initialVehicleId={quickAttendanceInitial.vehicleId}
        />
      )}
    </div>
  );
}

export default App;

