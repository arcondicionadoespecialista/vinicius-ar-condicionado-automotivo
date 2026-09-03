import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Key,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Lock,
  Mail,
  User as UserIcon,
  DollarSign,
  AlertTriangle,
  FileText,
  Settings,
  Sparkles,
  Info,
} from 'lucide-react';
import { User, UserRole, SystemModule, UserPermissions } from '../types';
import {
  getUsers,
  saveUser,
  deleteUser,
  ALL_SYSTEM_MODULES,
  DEFAULT_ADMIN_USER,
  STORAGE_KEYS,
} from '../services/storage';

interface UserManagementModalProps {
  currentUser: User | null;
}

export const UserManagement: React.FC<UserManagementModalProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>(() => getUsers());
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('funcionario');
  const [active, setActive] = useState(true);

  // Permissions state
  const [allowedModules, setAllowedModules] = useState<SystemModule[]>([
    'dashboard',
    'clients',
    'vehicles',
    'work_orders',
    'quotes',
    'stock',
    'relationship',
  ]);
  const [canViewFinancialTotals, setCanViewFinancialTotals] = useState(false);
  const [canManageTransactions, setCanManageTransactions] = useState(false);
  const [canViewReportsFinancials, setCanViewReportsFinancials] = useState(false);
  const [canEditSettings, setCanEditSettings] = useState(false);
  const [canManageUsersState, setCanManageUsersState] = useState(false);
  const [canDeleteRecords, setCanDeleteRecords] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isSuperAdmin = currentUser?.role === 'admin';

  const refreshList = () => {
    setUsers(getUsers());
  };

  useEffect(() => {
    refreshList();
    const handleStorageUpdate = (e: any) => {
      if (!e?.detail?.key || e?.detail?.key === STORAGE_KEYS.USERS) {
        setUsers(getUsers());
      }
    };
    window.addEventListener('storage_updated', handleStorageUpdate);
    return () => window.removeEventListener('storage_updated', handleStorageUpdate);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenNew = () => {
    setIsEditing(true);
    setEditingUserId(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('funcionario');
    setActive(true);
    setAllowedModules(['dashboard', 'clients', 'vehicles', 'work_orders', 'quotes', 'stock', 'relationship']);
    setCanViewFinancialTotals(false);
    setCanManageTransactions(false);
    setCanViewReportsFinancials(false);
    setCanEditSettings(false);
    setCanManageUsersState(false);
    setCanDeleteRecords(false);
  };

  const handleOpenEdit = (user: User) => {
    setIsEditing(true);
    setEditingUserId(user.id);
    setName(user.name);
    setEmail(user.email);
    setPassword(user.password || '');
    setRole(user.role);
    setActive(user.active !== false);

    if (user.role === 'admin') {
      setAllowedModules(ALL_SYSTEM_MODULES.map((m) => m.id));
      setCanViewFinancialTotals(true);
      setCanManageTransactions(true);
      setCanViewReportsFinancials(true);
      setCanEditSettings(true);
      setCanManageUsersState(true);
      setCanDeleteRecords(true);
    } else {
      const perms = user.permissions || {
        allowedModules: ['dashboard', 'clients', 'vehicles', 'work_orders', 'quotes'],
        canViewFinancialTotals: false,
        canManageTransactions: false,
        canViewReportsFinancials: false,
      };
      setAllowedModules(perms.allowedModules || []);
      setCanViewFinancialTotals(!!perms.canViewFinancialTotals);
      setCanManageTransactions(!!perms.canManageTransactions);
      setCanViewReportsFinancials(!!perms.canViewReportsFinancials);
      setCanEditSettings(!!perms.canEditSettings);
      setCanManageUsersState(!!perms.canManageUsers);
      setCanDeleteRecords(!!perms.canDeleteRecords);
    }
  };

  const handleToggleModule = (moduleId: SystemModule) => {
    if (role === 'admin') return; // Admins have all modules
    if (allowedModules.includes(moduleId)) {
      setAllowedModules(allowedModules.filter((m) => m !== moduleId));
      // If disabling finance or reports, automatically disable sub-permissions
      if (moduleId === 'finance') {
        setCanViewFinancialTotals(false);
        setCanManageTransactions(false);
      }
      if (moduleId === 'reports') {
        setCanViewReportsFinancials(false);
      }
    } else {
      setAllowedModules([...allowedModules, moduleId]);
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'admin') {
      setAllowedModules(ALL_SYSTEM_MODULES.map((m) => m.id));
      setCanViewFinancialTotals(true);
      setCanManageTransactions(true);
      setCanViewReportsFinancials(true);
      setCanEditSettings(true);
      setCanManageUsersState(true);
      setCanDeleteRecords(true);
    } else {
      // Default employee permissions (safe, non-financial by default)
      setAllowedModules(['dashboard', 'clients', 'vehicles', 'work_orders', 'quotes', 'stock', 'relationship']);
      setCanViewFinancialTotals(false);
      setCanManageTransactions(false);
      setCanViewReportsFinancials(false);
      setCanEditSettings(false);
      setCanManageUsersState(false);
      setCanDeleteRecords(false);
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!name.trim() || !email.trim()) {
      showToast('Preencha o nome e o e-mail do usuário.', 'error');
      return;
    }

    if (!editingUserId && !password) {
      showToast('Defina uma senha de acesso para o novo usuário.', 'error');
      return;
    }

    const isTargetSuperAdmin =
      email.trim().toLowerCase() === DEFAULT_ADMIN_USER.email.toLowerCase() ||
      editingUserId === DEFAULT_ADMIN_USER.id;

    // Check duplicate email
    const existing = users.find(
      (u) => u.email.trim().toLowerCase() === email.trim().toLowerCase() && u.id !== editingUserId
    );
    if (existing) {
      showToast('Já existe um usuário cadastrado com este e-mail.', 'error');
      return;
    }

    const permissions: UserPermissions =
      role === 'admin'
        ? {
            allowedModules: ALL_SYSTEM_MODULES.map((m) => m.id),
            canViewFinancialTotals: true,
            canManageTransactions: true,
            canViewReportsFinancials: true,
            canEditSettings: true,
            canManageUsers: true,
            canDeleteRecords: true,
          }
        : {
            allowedModules,
            canViewFinancialTotals,
            canManageTransactions,
            canViewReportsFinancials,
            canEditSettings,
            canManageUsers: canManageUsersState,
            canDeleteRecords,
          };

    const userData: User = {
      id: editingUserId || 'usr_' + Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password || '123456',
      role: isTargetSuperAdmin ? 'admin' : role,
      companyId: 'comp_1',
      active: isTargetSuperAdmin ? true : active,
      permissions,
    };

    saveUser(userData);
    refreshList();
    setIsEditing(false);
    showToast(`Usuário "${userData.name}" salvo com sucesso!`);
  };

  const handleDelete = (user: User) => {
    if (user.email.toLowerCase() === DEFAULT_ADMIN_USER.email.toLowerCase() || user.id === 'usr_admin') {
      showToast('O Administrador Geral não pode ser excluído.', 'error');
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir o usuário ${user.name} (${user.email})?`)) {
      const ok = deleteUser(user.id);
      if (ok) {
        refreshList();
        showToast('Usuário excluído com sucesso.');
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-sky-600" />
            <span>Gestão de Usuários & Níveis de Acesso</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre funcionários, defina credenciais e controle exatamente quais módulos cada um pode acessar (com restrições de sigilo financeiro).
          </p>
        </div>

        {isSuperAdmin && !isEditing && (
          <button
            type="button"
            onClick={handleOpenNew}
            className="self-start sm:self-auto px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Usuário</span>
          </button>
        )}
      </div>

      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* MODAL / FORM: EDIT OR CREATE USER */}
      {isEditing ? (
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-sky-600" />
              <span>{editingUserId ? 'Editar Usuário & Permissões' : 'Cadastrar Novo Usuário'}</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold px-2 py-1 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSaveUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: João Silva (Mecânico)"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail de Login *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="funcionario@oficina.com"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Senha de Acesso {editingUserId ? '(Deixe em branco para manter)' : '*'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingUserId ? 'Nova senha opcional' : 'Crie a senha do usuário'}
                    className="w-full pl-9 pr-10 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Função / Perfil Geral
                </label>
                <select
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="funcionario">Funcionário / Técnico (Acesso Customizado)</option>
                  <option value="admin">Administrador (Acesso Irrestrito)</option>
                </select>
              </div>
            </div>

            {/* Status Active Toggle */}
            <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl">
              <input
                type="checkbox"
                id="userActive"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
              <label htmlFor="userActive" className="text-xs font-bold text-slate-800 cursor-pointer">
                Usuário Ativo (Pode efetuar login no sistema)
              </label>
            </div>

            {/* PERMISSIONS MATRIX */}
            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h5 className="text-xs font-extrabold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    <span>Módulos Permitidos no Menu</span>
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Selecione quais telas este colaborador terá acesso.
                  </p>
                </div>
                {role === 'admin' && (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                    Administradores têm acesso total a todos os módulos
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
                {ALL_SYSTEM_MODULES.map((mod) => {
                  const isChecked = role === 'admin' || allowedModules.includes(mod.id);
                  const isSensitive = mod.sensitiveFinancial;

                  return (
                    <label
                      key={mod.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? isSensitive
                            ? 'bg-amber-50/70 border-amber-300/80 text-amber-950'
                            : 'bg-sky-50/70 border-sky-300/80 text-sky-950'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/60'
                      } ${role === 'admin' ? 'opacity-80 pointer-events-none' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={role === 'admin'}
                        onChange={() => handleToggleModule(mod.id)}
                        className="mt-0.5 w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <span className="font-bold block flex items-center gap-1">
                          {mod.label}
                          {isSensitive && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded">
                              Sigiloso
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-500 leading-tight block">
                          {mod.description}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* GRANULAR FINANCIAL RESTRICTIONS */}
            <div className="pt-3 border-t border-slate-200">
              <div className="bg-amber-500/10 border border-amber-300/60 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <DollarSign className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>Proteção & Sigilo Financeiro Especial</span>
                </div>
                <p className="text-[11px] text-amber-800/90 leading-relaxed">
                  Controle se este usuário poderá enxergar o faturamento da oficina, lucros e movimentar dinheiro:
                </p>

                <div className="space-y-2 pt-1 text-xs">
                  <label className="flex items-center gap-2.5 text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={role === 'admin' || canViewFinancialTotals}
                      disabled={role === 'admin'}
                      onChange={(e) => setCanViewFinancialTotals(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>
                      <strong>Visualizar Totais Financeiros</strong> (Faturamento, lucro líquido e saldos nos cards de início)
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={role === 'admin' || canManageTransactions}
                      disabled={role === 'admin'}
                      onChange={(e) => setCanManageTransactions(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>
                      <strong>Lançar e Baixar Contas</strong> (Cadastrar entradas/despesas e dar baixa em cobranças)
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={role === 'admin' || canViewReportsFinancials}
                      disabled={role === 'admin'}
                      onChange={(e) => setCanViewReportsFinancials(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>
                      <strong>Ver Relatórios Gerenciais de Faturamento</strong>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar Credencial & Permissões</span>
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* USERS LIST TABLE */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Usuários Cadastrados ({users.length})
        </h4>

        <div className="grid grid-cols-1 gap-3">
          {users.map((u) => {
            const isSuperAdminUser =
              u.email.toLowerCase() === DEFAULT_ADMIN_USER.email.toLowerCase() ||
              u.id === 'usr_admin';

            const userAllowedModules =
              u.role === 'admin'
                ? ALL_SYSTEM_MODULES.map((m) => m.label)
                : (u.permissions?.allowedModules || []).map((mId) => {
                    const found = ALL_SYSTEM_MODULES.find((m) => m.id === mId);
                    return found ? found.label : mId;
                  });

            const hasFinance =
              u.role === 'admin' ||
              (u.permissions?.allowedModules?.includes('finance') && u.permissions?.canViewFinancialTotals);

            return (
              <div
                key={u.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">{u.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        u.role === 'admin'
                          ? 'bg-sky-100 text-sky-800 border-sky-200'
                          : 'bg-slate-200 text-slate-700 border-slate-300'
                      }`}
                    >
                      {u.role === 'admin' ? 'Administrador' : 'Funcionário'}
                    </span>

                    {u.active === false ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                        Inativo
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                        Ativo
                      </span>
                    )}

                    {hasFinance ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <span>Acesso ao Financeiro</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Financeiro Bloqueado</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <strong>{u.email}</strong>
                    </span>
                    {u.password && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                        <Key className="w-3 h-3" />
                        Senha: ••••••••
                      </span>
                    )}
                  </div>

                  {/* Modules badges */}
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    <span className="text-[10px] text-slate-400 font-semibold mr-1">Telas:</span>
                    {userAllowedModules.slice(0, 5).map((label, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded"
                      >
                        {label}
                      </span>
                    ))}
                    {userAllowedModules.length > 5 && (
                      <span className="text-[10px] text-slate-400">
                        +{userAllowedModules.length - 5} outras
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {isSuperAdmin && (
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(u)}
                      className="p-2 rounded-xl bg-white border border-slate-200 hover:border-sky-300 hover:text-sky-600 text-slate-600 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      title="Editar usuário e permissões"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Editar</span>
                    </button>

                    {!isSuperAdminUser && (
                      <button
                        type="button"
                        onClick={() => handleDelete(u)}
                        className="p-2 rounded-xl bg-white border border-slate-200 hover:border-rose-300 hover:text-rose-600 text-slate-400 transition-colors cursor-pointer"
                        title="Excluir usuário"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
