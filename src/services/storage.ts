import {
  CompanySettings,
  Client,
  Vehicle,
  ServiceCatalog,
  StockProduct,
  StockMovement,
  Quote,
  WorkOrder,
  FinancialTransaction,
  AccountsReceivable,
  MaintenanceReminder,
  FollowUp,
  MessageTemplate,
} from '../types';
import { getTodayString, addMonthsToDate, addDaysToDate } from '../utils/formatters';
import { supabase } from './supabase';

const STORAGE_KEYS = {
  SETTINGS: 'vinicius_ar_settings',
  CLIENTS: 'vinicius_ar_clients',
  VEHICLES: 'vinicius_ar_vehicles',
  SERVICES: 'vinicius_ar_services',
  STOCK: 'vinicius_ar_stock',
  STOCK_MOVEMENTS: 'vinicius_ar_stock_movements',
  QUOTES: 'vinicius_ar_quotes',
  WORK_ORDERS: 'vinicius_ar_work_orders',
  FINANCIALS: 'vinicius_ar_financials',
  RECEIVABLES: 'vinicius_ar_receivables',
  MAINTENANCE: 'vinicius_ar_maintenance',
  FOLLOWUPS: 'vinicius_ar_followups',
  TEMPLATES: 'vinicius_ar_templates',
};

// Safe Local Storage Helpers
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error('Error reading localStorage key ' + key, e);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('storage_updated', { detail: { key } }));
  } catch (e) {
    console.error('Error writing localStorage key ' + key, e);
  }
}

let dbQueue: Promise<any> = Promise.resolve();
function safeDb(query: any): void {
  dbQueue = dbQueue
    .then(() => Promise.resolve(query))
    .catch((err) => {
      console.warn('Supabase sync notice:', err);
    });
}

// ==========================================
// DB Converters (CamelCase <-> Snake_Case)
// ==========================================

const mapClientToDb = (c: Client) => ({
  id: c.id,
  company_id: c.companyId || 'comp_1',
  name: c.name,
  phone: c.phone,
  whatsapp: c.whatsapp || c.phone,
  cpf_cnpj: c.cpfCnpj || null,
  email: c.email || null,
  address: c.address || null,
  city: c.city || null,
  state: c.state || null,
  cep: c.cep || null,
  birth_day: c.birthDay || null,
  birth_month: c.birthMonth || null,
  notes: c.notes || null,
  created_at: c.createdAt || getTodayString(),
});

const mapClientFromDb = (r: any): Client => ({
  id: r.id,
  companyId: r.company_id || r.companyId || 'comp_1',
  name: r.name,
  phone: r.phone,
  whatsapp: r.whatsapp || r.phone,
  cpfCnpj: r.cpf_cnpj || r.cpfCnpj || '',
  email: r.email || '',
  address: r.address || '',
  city: r.city || '',
  state: r.state || '',
  cep: r.cep || '',
  birthDay: r.birth_day != null ? Number(r.birth_day) : r.birthDay,
  birthMonth: r.birth_month != null ? Number(r.birth_month) : r.birthMonth,
  notes: r.notes || '',
  createdAt: r.created_at || r.createdAt || getTodayString(),
});

const mapVehicleToDb = (v: Vehicle) => ({
  id: v.id,
  client_id: v.clientId,
  company_id: v.companyId || 'comp_1',
  plate: v.plate,
  make: v.make,
  model: v.model,
  version: v.version || null,
  year: Number(v.year),
  color: v.color || null,
  mileage: Number(v.mileage || 0),
  notes: v.notes || null,
  created_at: v.createdAt || getTodayString(),
});

const mapVehicleFromDb = (r: any): Vehicle => ({
  id: r.id,
  clientId: r.client_id || r.clientId,
  companyId: r.company_id || r.companyId || 'comp_1',
  plate: r.plate,
  make: r.make,
  model: r.model,
  version: r.version || '',
  year: Number(r.year || 2020),
  color: r.color || '',
  mileage: Number(r.mileage || 0),
  notes: r.notes || '',
  createdAt: r.created_at || r.createdAt || getTodayString(),
});

const mapServiceToDb = (s: ServiceCatalog) => ({
  id: s.id,
  company_id: s.companyId || 'comp_1',
  name: s.name,
  description: s.description || null,
  default_price: Number(s.defaultPrice),
  estimated_time_minutes: s.estimatedTimeMinutes ? Number(s.estimatedTimeMinutes) : null,
  has_periodic_return: !!s.hasPeriodicReturn,
  return_quantity: s.returnQuantity ? Number(s.returnQuantity) : null,
  return_unit: s.returnUnit || 'meses',
});

const mapServiceFromDb = (r: any): ServiceCatalog => ({
  id: r.id,
  companyId: r.company_id || r.companyId || 'comp_1',
  name: r.name,
  description: r.description || '',
  defaultPrice: Number(r.default_price ?? r.defaultPrice ?? 0),
  estimatedTimeMinutes: r.estimated_time_minutes != null ? Number(r.estimated_time_minutes) : r.estimatedTimeMinutes,
  hasPeriodicReturn: Boolean(r.has_periodic_return ?? r.hasPeriodicReturn),
  returnQuantity: r.return_quantity != null ? Number(r.return_quantity) : r.returnQuantity,
  returnUnit: r.return_unit || r.returnUnit || 'meses',
});

const mapStockToDb = (p: StockProduct) => ({
  id: p.id,
  company_id: p.companyId || 'comp_1',
  code: p.code || null,
  name: p.name,
  category: p.category,
  description: p.description || null,
  supplier: p.supplier || null,
  cost_price: Number(p.costPrice),
  sale_price: Number(p.salePrice),
  current_quantity: Number(p.currentQuantity || 0),
  minimum_quantity: Number(p.minimumQuantity || 0),
  unit: p.unit || 'Un',
  active: p.active !== false,
});

const mapStockFromDb = (r: any): StockProduct => ({
  id: r.id,
  companyId: r.company_id || r.companyId || 'comp_1',
  code: r.code || '',
  name: r.name,
  category: r.category,
  description: r.description || '',
  supplier: r.supplier || '',
  costPrice: Number(r.cost_price ?? r.costPrice ?? 0),
  salePrice: Number(r.sale_price ?? r.salePrice ?? 0),
  currentQuantity: Number(r.current_quantity ?? r.currentQuantity ?? 0),
  minimumQuantity: Number(r.minimum_quantity ?? r.minimumQuantity ?? 0),
  unit: r.unit || 'Un',
  active: r.active !== false,
});

const mapMovementToDb = (m: StockMovement) => ({
  id: m.id,
  company_id: m.companyId || 'comp_1',
  product_id: m.productId,
  product_name: m.productName,
  type: m.type,
  quantity: Number(m.quantity),
  date: m.date,
  reason: m.reason || null,
  user_name: m.userName || 'Vinícius',
});

const mapMovementFromDb = (r: any): StockMovement => ({
  id: r.id,
  companyId: r.company_id || r.companyId || 'comp_1',
  productId: r.product_id || r.productId,
  productName: r.product_name || r.productName,
  type: r.type,
  quantity: Number(r.quantity),
  date: r.date,
  reason: r.reason || '',
  userName: r.user_name || r.userName || 'Vinícius',
});

const mapQuoteToDb = (q: Quote) => ({
  id: q.id,
  company_id: q.companyId || 'comp_1',
  code: q.code,
  client_id: q.clientId,
  vehicle_id: q.vehicleId,
  date: q.date,
  valid_until: q.validUntil,
  items: q.items || [],
  labor_cost: Number(q.laborCost || 0),
  discount: Number(q.discount || 0),
  total_amount: Number(q.totalAmount || 0),
  status: q.status,
  notes: q.notes || null,
  created_at: q.createdAt || getTodayString(),
});

const mapQuoteFromDb = (r: any): Quote => ({
  id: r.id,
  companyId: r.company_id || r.companyId || 'comp_1',
  code: r.code,
  clientId: r.client_id || r.clientId,
  vehicleId: r.vehicle_id || r.vehicleId,
  date: r.date,
  validUntil: r.valid_until || r.validUntil,
  items: r.items || [],
  laborCost: Number(r.labor_cost ?? r.laborCost ?? 0),
  discount: Number(r.discount ?? r.discount ?? 0),
  totalAmount: Number(r.total_amount ?? r.totalAmount ?? 0),
  status: r.status,
  notes: r.notes || '',
  createdAt: r.created_at || r.createdAt || getTodayString(),
});

const mapWorkOrderToDb = (w: WorkOrder) => ({
  id: w.id,
  company_id: w.companyId || 'comp_1',
  code: w.code,
  client_id: w.clientId,
  vehicle_id: w.vehicleId,
  date: w.date,
  mileage: Number(w.mileage || 0),
  client_complaint: w.clientComplaint || null,
  diagnosis: w.diagnosis || null,
  items: w.items || [],
  labor_cost: Number(w.laborCost || 0),
  discount: Number(w.discount || 0),
  total_amount: Number(w.totalAmount || 0),
  payment_method: w.paymentMethod,
  status: w.status,
  warranty_days: Number(w.warrantyDays || 90),
  next_return_date: w.nextReturnDate || null,
  notes: w.notes || null,
  completed_at: w.completedAt || null,
  created_at: w.createdAt || getTodayString(),
});

const mapWorkOrderFromDb = (r: any): WorkOrder => ({
  id: r.id,
  companyId: r.company_id || r.companyId || 'comp_1',
  code: r.code,
  clientId: r.client_id || r.clientId,
  vehicleId: r.vehicle_id || r.vehicleId,
  date: r.date,
  mileage: Number(r.mileage || 0),
  clientComplaint: r.client_complaint || r.clientComplaint || '',
  diagnosis: r.diagnosis || '',
  items: r.items || [],
  laborCost: Number(r.labor_cost ?? r.laborCost ?? 0),
  discount: Number(r.discount ?? r.discount ?? 0),
  totalAmount: Number(r.total_amount ?? r.totalAmount ?? 0),
  paymentMethod: r.payment_method || r.paymentMethod || 'pix',
  status: r.status,
  warrantyDays: Number(r.warranty_days ?? r.warrantyDays ?? 90),
  nextReturnDate: r.next_return_date || r.nextReturnDate,
  notes: r.notes || '',
  completedAt: r.completed_at || r.completedAt,
  createdAt: r.created_at || r.createdAt || getTodayString(),
});

const mapFinancialToDb = (t: FinancialTransaction) => ({
  id: t.id,
  company_id: t.companyId || 'comp_1',
  type: t.type,
  description: t.description,
  client_id: t.clientId || null,
  work_order_id: t.workOrderId || null,
  category: t.category,
  amount: Number(t.amount),
  date: t.date,
  due_date: t.dueDate || null,
  payment_method: t.paymentMethod,
  status: t.status,
  notes: t.notes || null,
  created_at: t.createdAt || getTodayString(),
});

const mapFinancialFromDb = (r: any): FinancialTransaction => ({
  id: r.id,
  companyId: r.company_id || r.companyId || 'comp_1',
  type: r.type,
  description: r.description,
  clientId: r.client_id || r.clientId,
  workOrderId: r.work_order_id || r.workOrderId,
  category: r.category,
  amount: Number(r.amount),
  date: r.date,
  dueDate: r.due_date || r.dueDate,
  paymentMethod: r.payment_method || r.paymentMethod || 'pix',
  status: r.status,
  notes: r.notes || '',
  createdAt: r.created_at || r.createdAt || getTodayString(),
});

const mapReceivableToDb = (r: AccountsReceivable) => ({
  id: r.id,
  company_id: r.companyId || 'comp_1',
  work_order_id: r.workOrderId || null,
  client_id: r.clientId,
  description: r.description,
  total_amount: Number(r.totalAmount),
  down_payment: Number(r.downPayment),
  installments_count: Number(r.installmentsCount),
  installments: r.installments || [],
  status: r.status,
  created_at: r.createdAt || getTodayString(),
});

const mapReceivableFromDb = (r: any): AccountsReceivable => ({
  id: r.id,
  companyId: r.company_id || r.companyId || 'comp_1',
  workOrderId: r.work_order_id || r.workOrderId,
  clientId: r.client_id || r.clientId,
  description: r.description,
  totalAmount: Number(r.total_amount ?? r.totalAmount ?? 0),
  downPayment: Number(r.down_payment ?? r.downPayment ?? 0),
  installmentsCount: Number(r.installments_count ?? r.installmentsCount ?? 1),
  installments: r.installments || [],
  status: r.status,
  createdAt: r.created_at || r.createdAt || getTodayString(),
});

const mapSettingsToDb = (s: CompanySettings) => ({
  id: s.id || 'comp_1',
  name: s.name,
  trade_name: s.tradeName || null,
  cnpj_cpf: s.cnpjCpf || null,
  phone: s.phone,
  whatsapp: s.whatsapp || null,
  email: s.email || null,
  address: s.address || null,
  city: s.city || null,
  state: s.state || null,
  cep: s.cep || null,
  logo_url: s.logoUrl || null,
  post_service_follow_up_days: Number(s.postServiceFollowUpDays || 3),
  footer_text: s.footerText || null,
  birthday_msg_template: s.birthdayMsgTemplate || null,
  follow_up_msg_template: s.followUpMsgTemplate || null,
  maintenance_msg_template: s.maintenanceMsgTemplate || null,
  due_payment_msg_template: s.duePaymentMsgTemplate || null,
});

const mapSettingsFromDb = (r: any): CompanySettings => ({
  id: r.id || 'comp_1',
  name: r.name || 'Vinícius Ar-Condicionado Automotivo',
  tradeName: r.trade_name || r.tradeName || 'Vinícius AR Automotivo',
  cnpjCpf: r.cnpj_cpf || r.cnpjCpf || '42.189.304/0001-92',
  phone: r.phone || '(37) 99999-9999',
  whatsapp: r.whatsapp || '(37) 99999-9999',
  email: r.email || 'contato@viniciusarcondicionado.com.br',
  address: r.address || 'Av. Governador Valadares, 1250 - Centro',
  city: r.city || 'Divinópolis',
  state: r.state || 'MG',
  cep: r.cep || '35500-000',
  logoUrl: r.logo_url || r.logoUrl,
  postServiceFollowUpDays: Number(r.post_service_follow_up_days ?? r.postServiceFollowUpDays ?? 3),
  footerText: r.footer_text || r.footerText || 'Garantia de 90 dias nos serviços prestados. Agradecemos a preferência!',
  birthdayMsgTemplate: r.birthday_msg_template || r.birthdayMsgTemplate || '',
  followUpMsgTemplate: r.follow_up_msg_template || r.followUpMsgTemplate || '',
  maintenanceMsgTemplate: r.maintenance_msg_template || r.maintenanceMsgTemplate || '',
  duePaymentMsgTemplate: r.due_payment_msg_template || r.duePaymentMsgTemplate || '',
});

const mapReminderToDb = (m: MaintenanceReminder) => ({
  id: m.id,
  company_id: m.companyId || 'comp_1',
  client_id: m.clientId,
  vehicle_id: m.vehicleId,
  service_name: m.serviceName,
  last_service_date: m.lastServiceDate,
  due_date: m.dueDate,
  status: m.status,
  notes: m.notes || null,
  last_contact_date: m.lastContactDate || null,
});

const mapReminderFromDb = (r: any): MaintenanceReminder => ({
  id: r.id,
  companyId: r.company_id || r.companyId || 'comp_1',
  clientId: r.client_id || r.clientId,
  vehicleId: r.vehicle_id || r.vehicleId,
  serviceName: r.service_name || r.serviceName,
  lastServiceDate: r.last_service_date || r.lastServiceDate,
  dueDate: r.due_date || r.dueDate,
  status: r.status,
  notes: r.notes || '',
  lastContactDate: r.last_contact_date || r.lastContactDate,
});

const mapFollowUpToDb = (f: FollowUp) => ({
  id: f.id,
  company_id: f.companyId || 'comp_1',
  work_order_id: f.workOrderId,
  client_id: f.clientId,
  vehicle_id: f.vehicleId,
  service_date: f.serviceDate,
  reminder_date: f.reminderDate,
  status: f.status,
  notes: f.notes || null,
  last_contact_date: f.lastContactDate || null,
});

const mapFollowUpFromDb = (r: any): FollowUp => ({
  id: r.id,
  companyId: r.company_id || r.companyId || 'comp_1',
  workOrderId: r.work_order_id || r.workOrderId,
  clientId: r.client_id || r.clientId,
  vehicleId: r.vehicle_id || r.vehicleId,
  serviceDate: r.service_date || r.serviceDate,
  reminderDate: r.reminder_date || r.reminderDate,
  status: r.status,
  notes: r.notes || '',
  lastContactDate: r.last_contact_date || r.lastContactDate,
});

const mapTemplateToDb = (t: MessageTemplate) => ({
  id: t.id,
  company_id: t.companyId || 'comp_1',
  category: t.category,
  title: t.title,
  content: t.content,
});

const mapTemplateFromDb = (r: any): MessageTemplate => ({
  id: r.id,
  companyId: r.company_id || r.companyId || 'comp_1',
  category: r.category,
  title: r.title,
  content: r.content,
});

// ==========================================
// ASYNC SUPABASE SYNC / SEED ENGINE
// ==========================================

export async function fetchAllFromSupabase() {
  try {
    const [
      settingsRes,
      clientsRes,
      vehiclesRes,
      servicesRes,
      stockRes,
      movementsRes,
      quotesRes,
      workOrdersRes,
      financialsRes,
      receivablesRes,
      remindersRes,
      followUpsRes,
      templatesRes,
    ] = await Promise.all([
      supabase.from('company_settings').select('*').limit(1),
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
      supabase.from('services_catalog').select('*').order('name'),
      supabase.from('stock_products').select('*').order('name'),
      supabase.from('stock_movements').select('*').order('date', { ascending: false }),
      supabase.from('quotes').select('*').order('created_at', { ascending: false }),
      supabase.from('work_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('financial_transactions').select('*').order('date', { ascending: false }),
      supabase.from('accounts_receivable').select('*').order('created_at', { ascending: false }),
      supabase.from('maintenance_reminders').select('*'),
      supabase.from('follow_ups').select('*'),
      supabase.from('message_templates').select('*'),
    ]);

    let hadRemoteData = false;

    if (settingsRes.data && settingsRes.data.length > 0) {
      setItem(STORAGE_KEYS.SETTINGS, mapSettingsFromDb(settingsRes.data[0]));
      hadRemoteData = true;
    }
    if (clientsRes.data && clientsRes.data.length > 0) {
      setItem(STORAGE_KEYS.CLIENTS, clientsRes.data.map(mapClientFromDb));
      hadRemoteData = true;
    }
    if (vehiclesRes.data && vehiclesRes.data.length > 0) {
      setItem(STORAGE_KEYS.VEHICLES, vehiclesRes.data.map(mapVehicleFromDb));
      hadRemoteData = true;
    }
    if (servicesRes.data && servicesRes.data.length > 0) {
      setItem(STORAGE_KEYS.SERVICES, servicesRes.data.map(mapServiceFromDb));
      hadRemoteData = true;
    }
    if (stockRes.data && stockRes.data.length > 0) {
      setItem(STORAGE_KEYS.STOCK, stockRes.data.map(mapStockFromDb));
      hadRemoteData = true;
    }
    if (movementsRes.data && movementsRes.data.length > 0) {
      setItem(STORAGE_KEYS.STOCK_MOVEMENTS, movementsRes.data.map(mapMovementFromDb));
      hadRemoteData = true;
    }
    if (quotesRes.data && quotesRes.data.length > 0) {
      setItem(STORAGE_KEYS.QUOTES, quotesRes.data.map(mapQuoteFromDb));
      hadRemoteData = true;
    }
    if (workOrdersRes.data && workOrdersRes.data.length > 0) {
      setItem(STORAGE_KEYS.WORK_ORDERS, workOrdersRes.data.map(mapWorkOrderFromDb));
      hadRemoteData = true;
    }
    if (financialsRes.data && financialsRes.data.length > 0) {
      setItem(STORAGE_KEYS.FINANCIALS, financialsRes.data.map(mapFinancialFromDb));
      hadRemoteData = true;
    }
    if (receivablesRes.data && receivablesRes.data.length > 0) {
      setItem(STORAGE_KEYS.RECEIVABLES, receivablesRes.data.map(mapReceivableFromDb));
      hadRemoteData = true;
    }
    if (remindersRes.data && remindersRes.data.length > 0) {
      setItem(STORAGE_KEYS.MAINTENANCE, remindersRes.data.map(mapReminderFromDb));
      hadRemoteData = true;
    }
    if (followUpsRes.data && followUpsRes.data.length > 0) {
      setItem(STORAGE_KEYS.FOLLOWUPS, followUpsRes.data.map(mapFollowUpFromDb));
      hadRemoteData = true;
    }
    if (templatesRes.data && templatesRes.data.length > 0) {
      setItem(STORAGE_KEYS.TEMPLATES, templatesRes.data.map(mapTemplateFromDb));
      hadRemoteData = true;
    }

    return hadRemoteData;
  } catch (err) {
    console.warn('Supabase fetchAll error (will rely on local memory cache):', err);
    return false;
  }
}

// Seed initial demo data
export function seedInitialData(force = false) {
  // Trigger Supabase fetch in background
  fetchAllFromSupabase().then((hadData) => {
    if (!hadData && !localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      pushDefaultSeedData();
    }
  });

  if (!force && localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    return; // Already initialized locally
  }

  pushDefaultSeedData();
}

function pushDefaultSeedData() {
  const companyId = 'comp_1';
  const today = getTodayString();

  const settings: CompanySettings = {
    id: companyId,
    name: 'Vinícius Ar-Condicionado Automotivo',
    tradeName: 'Vinícius AR Automotivo',
    cnpjCpf: '42.189.304/0001-92',
    phone: '(37) 99999-9999',
    whatsapp: '(37) 99999-9999',
    email: 'contato@viniciusarcondicionado.com.br',
    address: 'Av. Governador Valadares, 1250 - Centro',
    city: 'Divinópolis',
    state: 'MG',
    cep: '35500-000',
    postServiceFollowUpDays: 3,
    footerText: 'Garantia de 90 dias nos serviços prestados. Agradecemos a preferência!',
    birthdayMsgTemplate:
      'Olá, {NOME}! Parabéns pelo seu aniversário! Desejamos muita saúde e paz. Toda a equipe da {EMPRESA} te deseja um dia excelente!',
    followUpMsgTemplate:
      'Olá, {NOME}! Tudo bem? Passando para saber se o ar-condicionado do seu {VEICULO} está gelando perfeitamente após o serviço na {EMPRESA}? Qualquer dúvida estamos à disposição!',
    maintenanceMsgTemplate:
      'Olá, {NOME}! Já se passaram 6 meses desde a última manutenção do ar-condicionado do seu {VEICULO} ({PLACA}). Recomendamos uma nova higienização para manter o ar limpo e saudável!',
    duePaymentMsgTemplate:
      'Olá, {NOME}! Tudo bem? Passando rapidamente da {EMPRESA} para enviar o lembrete da sua parcela referente ao serviço no {VEICULO}. Caso precise da chave PIX para pagamento, só nos avisar!',
  };

  const todayDate = new Date();
  const currentMonth = todayDate.getMonth() + 1;
  const currentDay = todayDate.getDate();

  const clients: Client[] = [
    {
      id: 'cli_1',
      companyId,
      name: 'Carlos Eduardo Silva',
      phone: '(37) 99888-7766',
      whatsapp: '(37) 99888-7766',
      cpfCnpj: '109.876.543-21',
      email: 'carlos.eduardo@email.com',
      address: 'Rua Pernambuco, 450',
      city: 'Divinópolis',
      state: 'MG',
      cep: '35500-010',
      birthDay: 15,
      birthMonth: 4,
      notes: 'Cliente exigente com a limpeza do interior.',
      createdAt: addDaysToDate(today, -60),
    },
    {
      id: 'cli_2',
      companyId,
      name: 'Juliana Mendes',
      phone: '(37) 99123-4567',
      whatsapp: '(37) 99123-4567',
      cpfCnpj: '228.910.456-88',
      email: 'juliana.mendes@email.com',
      address: 'Av. 7 de Setembro, 890',
      city: 'Divinópolis',
      state: 'MG',
      cep: '35500-020',
      birthDay: currentDay,
      birthMonth: currentMonth,
      notes: 'Usa o carro para viagens frequentes de trabalho.',
      createdAt: addDaysToDate(today, -30),
    },
    {
      id: 'cli_3',
      companyId,
      name: 'Marcos Oliveira',
      phone: '(37) 99765-4321',
      whatsapp: '(37) 99765-4321',
      cpfCnpj: '334.556.778-99',
      address: 'Rua Goiás, 1100',
      city: 'Divinópolis',
      state: 'MG',
      birthDay: 28,
      birthMonth: 11,
      notes: 'Proprietário de frota pequena de veículos comercial.',
      createdAt: addDaysToDate(today, -15),
    },
  ];

  const vehicles: Vehicle[] = [
    {
      id: 'veh_1',
      clientId: 'cli_1',
      companyId,
      plate: 'ABC1D23',
      make: 'Chevrolet',
      model: 'Onix',
      version: '1.0 Turbo LTZ',
      year: 2021,
      color: 'Prata',
      mileage: 42500,
      notes: 'Filtro higienizado na última revisão.',
      createdAt: addDaysToDate(today, -60),
    },
    {
      id: 'veh_2',
      clientId: 'cli_2',
      companyId,
      plate: 'JKL4E56',
      make: 'Toyota',
      model: 'Corolla',
      version: '2.0 XEi',
      year: 2022,
      color: 'Preto',
      mileage: 38000,
      notes: 'Ar com fraco rendimento antes do serviço.',
      createdAt: addDaysToDate(today, -30),
    },
    {
      id: 'veh_3',
      clientId: 'cli_3',
      companyId,
      plate: 'MNO7890',
      make: 'Fiat',
      model: 'Toro',
      version: '2.0 Diesel 4x4',
      year: 2020,
      color: 'Branco',
      mileage: 78000,
      notes: 'Ruído no compressor.',
      createdAt: addDaysToDate(today, -15),
    },
  ];

  const services: ServiceCatalog[] = [
    {
      id: 'srv_1',
      companyId,
      name: 'Higienização do Ar-Condicionado',
      description: 'Ozonização do sistema e aplicação de spray bactericida.',
      defaultPrice: 180,
      estimatedTimeMinutes: 45,
      hasPeriodicReturn: true,
      returnQuantity: 6,
      returnUnit: 'meses',
    },
    {
      id: 'srv_2',
      companyId,
      name: 'Carga de Gás Refrigerante R134a',
      description: 'Vácuo completo no sistema, injeção de óleo com contraste UV e carga de gás.',
      defaultPrice: 220,
      estimatedTimeMinutes: 60,
      hasPeriodicReturn: true,
      returnQuantity: 12,
      returnUnit: 'meses',
    },
    {
      id: 'srv_3',
      companyId,
      name: 'Troca do Filtro de Cabine',
      description: 'Substituição do elemento filtrante anti-pólen e limpeza da caixa evaporadora.',
      defaultPrice: 90,
      estimatedTimeMinutes: 20,
      hasPeriodicReturn: true,
      returnQuantity: 6,
      returnUnit: 'meses',
    },
    {
      id: 'srv_4',
      companyId,
      name: 'Diagnóstico e Teste de Estanqueidade',
      description: 'Pressurização com Nitrogênio para localização de micro vazamentos.',
      defaultPrice: 120,
      estimatedTimeMinutes: 40,
      hasPeriodicReturn: false,
    },
    {
      id: 'srv_5',
      companyId,
      name: 'Troca de Compressor e Flush',
      description: 'Substituição do compressor, condensador e limpeza interna das tubulações com R141b.',
      defaultPrice: 1250,
      estimatedTimeMinutes: 240,
      hasPeriodicReturn: true,
      returnQuantity: 12,
      returnUnit: 'meses',
    },
  ];

  const stock: StockProduct[] = [
    {
      id: 'prod_1',
      companyId,
      code: 'GAS-R134A',
      name: 'Gás Refrigerante R134a (Garrafa 13,6kg)',
      category: 'Gás Refrigerante',
      description: 'Gás refrigerante para sistemas automotivos padrão.',
      supplier: 'Chemours / Dupont',
      costPrice: 420.0,
      salePrice: 650.0,
      currentQuantity: 4,
      minimumQuantity: 2,
      unit: 'Garrafa',
      active: true,
    },
    {
      id: 'prod_2',
      companyId,
      code: 'FIL-ONIX',
      name: 'Filtro de Cabine Onix/Tracker 2020+',
      category: 'Filtros',
      description: 'Filtro de ar-condicionado de carvão ativado.',
      supplier: 'Tecfil',
      costPrice: 28.5,
      salePrice: 65.0,
      currentQuantity: 8,
      minimumQuantity: 3,
      unit: 'Un',
      active: true,
    },
    {
      id: 'prod_3',
      companyId,
      code: 'FIL-COROLLA',
      name: 'Filtro de Cabine Corolla 2019+',
      category: 'Filtros',
      description: 'Filtro de ar condicionado padrão.',
      supplier: 'Wega',
      costPrice: 32.0,
      salePrice: 70.0,
      currentQuantity: 2,
      minimumQuantity: 3,
      unit: 'Un',
      active: true,
    },
    {
      id: 'prod_4',
      companyId,
      code: 'OIL-PAG46',
      name: 'Óleo Sintético PAG 46 com Contraste UV',
      category: 'Óleos e Aditivos',
      description: 'Óleo para compressores R134a com detector de vazamento UV.',
      supplier: 'Errecom',
      costPrice: 45.0,
      salePrice: 85.0,
      currentQuantity: 12,
      minimumQuantity: 4,
      unit: 'Frasco 250ml',
      active: true,
    },
    {
      id: 'prod_5',
      companyId,
      code: 'VAL-SCHRADER',
      name: 'Válvula de Serviço Alta/Baixa Schrader',
      category: 'Peças e Conexões',
      description: 'Reparo de bico de engate de serviço.',
      supplier: 'Mastercool',
      costPrice: 8.0,
      salePrice: 25.0,
      currentQuantity: 25,
      minimumQuantity: 10,
      unit: 'Un',
      active: true,
    },
    {
      id: 'prod_6',
      companyId,
      code: 'CMP-ONIX',
      name: 'Compressor Mahle Onix 1.0 Turbo',
      category: 'Peças e Conexões',
      description: 'Compressor original Mahle 6PK 12V.',
      supplier: 'Mahle Autopeças',
      costPrice: 1100.0,
      salePrice: 1650.0,
      currentQuantity: 1,
      minimumQuantity: 1,
      unit: 'Un',
      active: true,
    },
  ];

  const stockMovements: StockMovement[] = [
    {
      id: 'mov_1',
      companyId,
      productId: 'prod_1',
      productName: 'Gás Refrigerante R134a (Garrafa 13,6kg)',
      type: 'entrada',
      quantity: 5,
      date: addDaysToDate(today, -45),
      reason: 'Compra de estoque inicial',
      userName: 'Vinícius',
    },
    {
      id: 'mov_2',
      companyId,
      productId: 'prod_2',
      productName: 'Filtro de Cabine Onix/Tracker 2020+',
      type: 'entrada',
      quantity: 10,
      date: addDaysToDate(today, -45),
      reason: 'Compra fornecedor Tecfil',
      userName: 'Vinícius',
    },
    {
      id: 'mov_3',
      companyId,
      productId: 'prod_2',
      productName: 'Filtro de Cabine Onix/Tracker 2020+',
      type: 'uso_servico',
      quantity: 1,
      date: addDaysToDate(today, -20),
      reason: 'Utilizado na OS-2001',
      userName: 'Vinícius',
    },
  ];

  const quotes: Quote[] = [
    {
      id: 'orc_1',
      companyId,
      code: 'ORC-1001',
      clientId: 'cli_3',
      vehicleId: 'veh_3',
      date: addDaysToDate(today, -5),
      validUntil: addDaysToDate(today, 10),
      items: [
        {
          id: 'item_1',
          type: 'servico',
          refId: 'srv_5',
          description: 'Troca de Compressor e Flush no Sistema',
          quantity: 1,
          unitPrice: 1250,
          totalPrice: 1250,
        },
        {
          id: 'item_2',
          type: 'peca',
          refId: 'prod_1',
          description: 'Carga de Gás Refrigerante R134a',
          quantity: 1,
          unitPrice: 220,
          totalPrice: 220,
        },
        {
          id: 'item_3',
          type: 'peca',
          refId: 'prod_4',
          description: 'Óleo Sintético PAG 46 com Contraste UV',
          quantity: 1,
          unitPrice: 85,
          totalPrice: 85,
        },
      ],
      laborCost: 1250,
      discount: 55,
      totalAmount: 1500,
      status: 'enviado',
      notes: 'Cliente irá aprovar até sexta-feira.',
      createdAt: addDaysToDate(today, -5),
    },
  ];

  const workOrders: WorkOrder[] = [
    {
      id: 'os_1',
      companyId,
      code: 'OS-2001',
      clientId: 'cli_1',
      vehicleId: 'veh_1',
      date: addDaysToDate(today, -20),
      mileage: 42500,
      clientComplaint: 'Ar parou de gelar repentinamente e cheiro forte de mofo.',
      diagnosis: 'Vazamento na válvula de serviço e filtro de cabine saturado.',
      items: [
        {
          id: 'item_10',
          type: 'servico',
          refId: 'srv_2',
          description: 'Carga de Gás Refrigerante R134a + Vácuo e Teste',
          quantity: 1,
          unitPrice: 220,
          totalPrice: 220,
        },
        {
          id: 'item_11',
          type: 'servico',
          refId: 'srv_1',
          description: 'Higienização e Ozonização',
          quantity: 1,
          unitPrice: 180,
          totalPrice: 180,
        },
        {
          id: 'item_12',
          type: 'peca',
          refId: 'prod_2',
          description: 'Filtro de Cabine Onix/Tracker 2020+',
          quantity: 1,
          unitPrice: 65,
          totalPrice: 65,
        },
        {
          id: 'item_13',
          type: 'peca',
          refId: 'prod_5',
          description: 'Válvula de Serviço Schrader',
          quantity: 1,
          unitPrice: 25,
          totalPrice: 25,
        },
      ],
      laborCost: 400,
      discount: 40,
      totalAmount: 450,
      paymentMethod: 'pix',
      status: 'finalizado',
      warrantyDays: 90,
      nextReturnDate: addMonthsToDate(today, 5),
      notes: 'Serviço executado com sucesso. Temperatura na saída dos difusores: 4.8°C.',
      completedAt: addDaysToDate(today, -20),
      createdAt: addDaysToDate(today, -20),
    },
    {
      id: 'os_2',
      companyId,
      code: 'OS-2002',
      clientId: 'cli_2',
      vehicleId: 'veh_2',
      date: addDaysToDate(today, -2),
      mileage: 38000,
      clientComplaint: 'Ar-condicionado gelando pouco no trânsito pesado.',
      diagnosis: 'Baixa eficiência na troca térmica e nível de refrigerante baixo.',
      items: [
        {
          id: 'item_20',
          type: 'servico',
          refId: 'srv_2',
          description: 'Carga de Gás Refrigerante R134a com Contraste UV',
          quantity: 1,
          unitPrice: 220,
          totalPrice: 220,
        },
        {
          id: 'item_21',
          type: 'servico',
          refId: 'srv_3',
          description: 'Troca do Filtro de Cabine',
          quantity: 1,
          unitPrice: 90,
          totalPrice: 90,
        },
      ],
      laborCost: 310,
      discount: 0,
      totalAmount: 310,
      paymentMethod: 'credito',
      status: 'em_andamento',
      warrantyDays: 90,
      nextReturnDate: addMonthsToDate(today, 6),
      notes: 'Aguardando teste final em rota.',
      createdAt: addDaysToDate(today, -2),
    },
  ];

  const financials: FinancialTransaction[] = [
    {
      id: 'fin_1',
      companyId,
      type: 'entrada',
      description: 'Recebimento Ordem de Serviço OS-2001 (Carlos Eduardo)',
      clientId: 'cli_1',
      workOrderId: 'os_1',
      category: 'Serviços de Ar-Condicionado',
      amount: 450.0,
      date: addDaysToDate(today, -20),
      paymentMethod: 'pix',
      status: 'pago',
      createdAt: addDaysToDate(today, -20),
    },
    {
      id: 'fin_2',
      companyId,
      type: 'saida',
      description: 'Compra de 5 Garrafas de Gás R134a + Filtros',
      category: 'Peças e Insumos',
      amount: 2385.0,
      date: addDaysToDate(today, -45),
      paymentMethod: 'transferencia',
      status: 'pago',
      createdAt: addDaysToDate(today, -45),
    },
    {
      id: 'fin_3',
      companyId,
      type: 'saida',
      description: 'Aluguel do Galpão da Oficina',
      category: 'Aluguel e Condomínio',
      amount: 1800.0,
      date: addDaysToDate(today, -10),
      dueDate: addDaysToDate(today, -10),
      paymentMethod: 'pix',
      status: 'pago',
      createdAt: addDaysToDate(today, -10),
    },
    {
      id: 'fin_4',
      companyId,
      type: 'saida',
      description: 'Conta de Energia Elétrica (CEMIG)',
      category: 'Energia Elétrica',
      amount: 420.0,
      date: addDaysToDate(today, 5),
      dueDate: addDaysToDate(today, 5),
      paymentMethod: 'pix',
      status: 'pendente',
      createdAt: addDaysToDate(today, -2),
    },
  ];

  const receivables: AccountsReceivable[] = [
    {
      id: 'rec_1',
      companyId,
      workOrderId: 'os_1',
      clientId: 'cli_3',
      description: 'Serviço de Compressor Toro (Marcos Oliveira)',
      totalAmount: 1500,
      downPayment: 500,
      installmentsCount: 2,
      installments: [
        {
          number: 1,
          amount: 500,
          dueDate: addDaysToDate(today, 10),
          status: 'a_vencer',
        },
        {
          number: 2,
          amount: 500,
          dueDate: addDaysToDate(today, 40),
          status: 'a_vencer',
        },
      ],
      status: 'em_aberto',
      createdAt: addDaysToDate(today, -5),
    },
  ];

  const reminders: MaintenanceReminder[] = [
    {
      id: 'rem_1',
      companyId,
      clientId: 'cli_1',
      vehicleId: 'veh_1',
      serviceName: 'Higienização e Troca de Filtro (Revisão 6 meses)',
      lastServiceDate: addDaysToDate(today, -180),
      dueDate: addDaysToDate(today, -2),
      status: 'pendente',
      notes: 'Último serviço feito há 6 meses. Cliente viaja bastante.',
    },
    {
      id: 'rem_2',
      companyId,
      clientId: 'cli_3',
      vehicleId: 'veh_3',
      serviceName: 'Revisão Anual do Sistema e Carga de Gás',
      lastServiceDate: addDaysToDate(today, -350),
      dueDate: addDaysToDate(today, 15),
      status: 'pendente',
      notes: 'Carro de trabalho, ar-condicionado de uso contínuo.',
    },
  ];

  const followUps: FollowUp[] = [
    {
      id: 'fol_1',
      companyId,
      workOrderId: 'os_1',
      clientId: 'cli_1',
      vehicleId: 'veh_1',
      serviceDate: addDaysToDate(today, -2),
      reminderDate: today,
      status: 'pendente',
      notes: 'Entrar em contato para saber se o ar-condicionado do Onix está gelando perfeitamente.',
    },
  ];

  const templates: MessageTemplate[] = [
    {
      id: 'tmpl_1',
      companyId,
      category: 'aniversario',
      title: 'Felicitações de Aniversário',
      content:
        'Olá {NOME}, parabéns pelo seu dia! 🎉 Toda a equipe da {EMPRESA} deseja muita saúde, paz e sucesso!',
    },
    {
      id: 'tmpl_2',
      companyId,
      category: 'manutencao',
      title: 'Lembrete Preventivo de Ar-Condicionado',
      content:
        'Olá {NOME}! Já faz um tempo desde a última revisão do ar-condicionado do seu {VEICULO} ({PLACA}). Que tal agendarmos uma higienização para garantir um ar puro e gelando forte? ❄️',
    },
    {
      id: 'tmpl_3',
      companyId,
      category: 'pos_venda',
      title: 'Acompanhamento Pós-Serviço',
      content:
        'Olá {NOME}! Tudo bem? Passando para confirmar se o ar-condicionado do seu {VEICULO} está funcionando perfeitamente após o serviço na {EMPRESA}? Qualquer detalhe estamos à disposição!',
    },
    {
      id: 'tmpl_4',
      companyId,
      category: 'cobranca',
      title: 'Lembrete de Parcela',
      content:
        'Olá {NOME}! Tudo bem? Enviamos o lembrete da sua parcela referente ao serviço no seu {VEICULO}. Chave PIX: {PIX}. Muito obrigado!',
    },
  ];

  setItem(STORAGE_KEYS.SETTINGS, settings);
  setItem(STORAGE_KEYS.CLIENTS, clients);
  setItem(STORAGE_KEYS.VEHICLES, vehicles);
  setItem(STORAGE_KEYS.SERVICES, services);
  setItem(STORAGE_KEYS.STOCK, stock);
  setItem(STORAGE_KEYS.STOCK_MOVEMENTS, stockMovements);
  setItem(STORAGE_KEYS.QUOTES, quotes);
  setItem(STORAGE_KEYS.WORK_ORDERS, workOrders);
  setItem(STORAGE_KEYS.FINANCIALS, financials);
  setItem(STORAGE_KEYS.RECEIVABLES, receivables);
  setItem(STORAGE_KEYS.MAINTENANCE, reminders);
  setItem(STORAGE_KEYS.FOLLOWUPS, followUps);
  setItem(STORAGE_KEYS.TEMPLATES, templates);

  // Sync default seeds to Supabase in background
  Promise.all([
    supabase.from('company_settings').upsert(mapSettingsToDb(settings)),
    supabase.from('clients').upsert(clients.map(mapClientToDb)),
    supabase.from('vehicles').upsert(vehicles.map(mapVehicleToDb)),
    supabase.from('services_catalog').upsert(services.map(mapServiceToDb)),
    supabase.from('stock_products').upsert(stock.map(mapStockToDb)),
    supabase.from('stock_movements').upsert(stockMovements.map(mapMovementToDb)),
    supabase.from('quotes').upsert(quotes.map(mapQuoteToDb)),
    supabase.from('work_orders').upsert(workOrders.map(mapWorkOrderToDb)),
    supabase.from('financial_transactions').upsert(financials.map(mapFinancialToDb)),
    supabase.from('accounts_receivable').upsert(receivables.map(mapReceivableToDb)),
    supabase.from('maintenance_reminders').upsert(reminders.map(mapReminderToDb)),
    supabase.from('follow_ups').upsert(followUps.map(mapFollowUpToDb)),
    supabase.from('message_templates').upsert(templates.map(mapTemplateToDb)),
  ]).catch((err) => {
    console.warn('Initial Supabase upsert error:', err);
  });
}

// ==========================================
// CRUD EXPORTS (SYNCHRONOUS CACHE + SUPABASE)
// ==========================================

// COMPANY SETTINGS
export function getCompanySettings(): CompanySettings {
  const defaultSettings: CompanySettings = {
    id: 'comp_1',
    name: 'Vinícius Ar-Condicionado Automotivo',
    tradeName: 'Vinícius AR',
    cnpjCpf: '42.189.304/0001-92',
    phone: '(37) 99999-9999',
    whatsapp: '(37) 99999-9999',
    email: 'contato@viniciusarcondicionado.com.br',
    address: 'Av. Governador Valadares, 1250 - Centro',
    city: 'Divinópolis',
    state: 'MG',
    cep: '35500-000',
    postServiceFollowUpDays: 3,
    footerText: 'Garantia de 90 dias nos serviços prestados. Agradecemos a preferência!',
    birthdayMsgTemplate:
      'Olá, {NOME}! Parabéns pelo seu aniversário! Desejamos muita saúde e paz. Toda a equipe da {EMPRESA} te deseja um dia excelente!',
    followUpMsgTemplate:
      'Olá, {NOME}! Tudo bem? Passando para saber se o ar-condicionado do seu {VEICULO} está gelando perfeitamente após o serviço na {EMPRESA}? Qualquer dúvida estamos à disposição!',
    maintenanceMsgTemplate:
      'Olá, {NOME}! Já se passaram 6 meses desde a última manutenção do ar-condicionado do seu {VEICULO} ({PLACA}). Recomendamos uma nova higienização para manter o ar limpo e saudável!',
    duePaymentMsgTemplate:
      'Olá, {NOME}! Tudo bem? Passando rapidamente da {EMPRESA} para enviar o lembrete da sua parcela referente ao serviço no {VEICULO}. Caso precise da chave PIX para pagamento, só nos avisar!',
  };

  const stored = getItem<Partial<CompanySettings>>(STORAGE_KEYS.SETTINGS, {});
  return { ...defaultSettings, ...stored };
}

export function saveCompanySettings(settings: CompanySettings): void {
  setItem(STORAGE_KEYS.SETTINGS, settings);
  safeDb(supabase.from('company_settings').upsert(mapSettingsToDb(settings)));
}

// CLIENTS
export function getClients(): Client[] {
  return getItem<Client[]>(STORAGE_KEYS.CLIENTS, []);
}

export function saveClient(client: Partial<Client> & { name: string; phone: string }): Client {
  const clients = getClients();
  const now = getTodayString();
  let resultClient: Client;

  if (client.id) {
    const index = clients.findIndex((c) => c.id === client.id);
    if (index >= 0) {
      clients[index] = { ...clients[index], ...client };
      resultClient = clients[index];
    } else {
      resultClient = {
        id: client.id,
        companyId: client.companyId || 'comp_1',
        name: client.name,
        phone: client.phone,
        whatsapp: client.whatsapp || client.phone,
        cpfCnpj: client.cpfCnpj || '',
        email: client.email || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        cep: client.cep || '',
        birthDay: client.birthDay,
        birthMonth: client.birthMonth,
        notes: client.notes || '',
        createdAt: client.createdAt || now,
      };
      clients.unshift(resultClient);
    }
  } else {
    resultClient = {
      id: 'cli_' + Date.now(),
      companyId: 'comp_1',
      name: client.name,
      phone: client.phone,
      whatsapp: client.whatsapp || client.phone,
      cpfCnpj: client.cpfCnpj || '',
      email: client.email || '',
      address: client.address || '',
      city: client.city || '',
      state: client.state || '',
      cep: client.cep || '',
      birthDay: client.birthDay,
      birthMonth: client.birthMonth,
      notes: client.notes || '',
      createdAt: now,
    };
    clients.unshift(resultClient);
  }

  setItem(STORAGE_KEYS.CLIENTS, clients);
  safeDb(supabase.from('clients').upsert(mapClientToDb(resultClient)));
  return resultClient;
}

export function deleteClient(id: string): void {
  const clients = getClients().filter((c) => c.id !== id);
  setItem(STORAGE_KEYS.CLIENTS, clients);
  safeDb(supabase.from('clients').delete().eq('id', id));
}

// VEHICLES
export function getVehicles(): Vehicle[] {
  return getItem<Vehicle[]>(STORAGE_KEYS.VEHICLES, []);
}

export function getClientVehicles(clientId: string): Vehicle[] {
  return getVehicles().filter((v) => v.clientId === clientId);
}

export function saveVehicle(
  vehicle: Partial<Vehicle> & { clientId: string; plate: string; make: string; model: string; year: number }
): Vehicle {
  const vehicles = getVehicles();
  const cleanPlate = vehicle.plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const now = getTodayString();
  let resultVehicle: Vehicle;

  if (vehicle.id) {
    const index = vehicles.findIndex((v) => v.id === vehicle.id);
    if (index >= 0) {
      vehicles[index] = { ...vehicles[index], ...vehicle, plate: cleanPlate };
      resultVehicle = vehicles[index];
    } else {
      resultVehicle = {
        id: vehicle.id,
        companyId: vehicle.companyId || 'comp_1',
        clientId: vehicle.clientId,
        plate: cleanPlate,
        make: vehicle.make,
        model: vehicle.model,
        version: vehicle.version || '',
        year: Number(vehicle.year),
        color: vehicle.color || '',
        mileage: Number(vehicle.mileage || 0),
        notes: vehicle.notes || '',
        createdAt: vehicle.createdAt || now,
      };
      vehicles.unshift(resultVehicle);
    }
  } else {
    resultVehicle = {
      id: 'veh_' + Date.now(),
      companyId: 'comp_1',
      clientId: vehicle.clientId,
      plate: cleanPlate,
      make: vehicle.make,
      model: vehicle.model,
      version: vehicle.version || '',
      year: Number(vehicle.year),
      color: vehicle.color || '',
      mileage: Number(vehicle.mileage || 0),
      notes: vehicle.notes || '',
      createdAt: now,
    };
    vehicles.unshift(resultVehicle);
  }

  setItem(STORAGE_KEYS.VEHICLES, vehicles);
  safeDb(supabase.from('vehicles').upsert(mapVehicleToDb(resultVehicle)));
  return resultVehicle;
}

export function deleteVehicle(id: string): void {
  const vehicles = getVehicles().filter((v) => v.id !== id);
  setItem(STORAGE_KEYS.VEHICLES, vehicles);
  safeDb(supabase.from('vehicles').delete().eq('id', id));
}

// SERVICE CATALOG
export function getServiceCatalog(): ServiceCatalog[] {
  return getItem<ServiceCatalog[]>(STORAGE_KEYS.SERVICES, []);
}

export function saveServiceCatalog(srv: Partial<ServiceCatalog> & { name: string; defaultPrice: number }): ServiceCatalog {
  const services = getServiceCatalog();
  let resultService: ServiceCatalog;

  if (srv.id) {
    const index = services.findIndex((s) => s.id === srv.id);
    if (index >= 0) {
      services[index] = { ...services[index], ...srv };
      resultService = services[index];
    } else {
      resultService = {
        id: srv.id,
        companyId: srv.companyId || 'comp_1',
        name: srv.name,
        description: srv.description || '',
        defaultPrice: Number(srv.defaultPrice),
        estimatedTimeMinutes: srv.estimatedTimeMinutes ? Number(srv.estimatedTimeMinutes) : undefined,
        hasPeriodicReturn: !!srv.hasPeriodicReturn,
        returnQuantity: srv.returnQuantity ? Number(srv.returnQuantity) : undefined,
        returnUnit: srv.returnUnit || 'meses',
      };
      services.push(resultService);
    }
  } else {
    resultService = {
      id: 'srv_' + Date.now(),
      companyId: 'comp_1',
      name: srv.name,
      description: srv.description || '',
      defaultPrice: Number(srv.defaultPrice),
      estimatedTimeMinutes: srv.estimatedTimeMinutes ? Number(srv.estimatedTimeMinutes) : undefined,
      hasPeriodicReturn: !!srv.hasPeriodicReturn,
      returnQuantity: srv.returnQuantity ? Number(srv.returnQuantity) : undefined,
      returnUnit: srv.returnUnit || 'meses',
    };
    services.push(resultService);
  }

  setItem(STORAGE_KEYS.SERVICES, services);
  safeDb(supabase.from('services_catalog').upsert(mapServiceToDb(resultService)));
  return resultService;
}

// STOCK
export function getStockProducts(): StockProduct[] {
  return getItem<StockProduct[]>(STORAGE_KEYS.STOCK, []);
}

export function getStockMovements(): StockMovement[] {
  return getItem<StockMovement[]>(STORAGE_KEYS.STOCK_MOVEMENTS, []);
}

export function saveStockProduct(
  prod: Partial<StockProduct> & { name: string; category: string; costPrice: number; salePrice: number }
): StockProduct {
  const stock = getStockProducts();
  let resultProd: StockProduct;

  if (prod.id) {
    const index = stock.findIndex((p) => p.id === prod.id);
    if (index >= 0) {
      stock[index] = { ...stock[index], ...prod };
      resultProd = stock[index];
    } else {
      resultProd = {
        id: prod.id,
        companyId: prod.companyId || 'comp_1',
        code: prod.code || '',
        name: prod.name,
        category: prod.category,
        description: prod.description || '',
        supplier: prod.supplier || '',
        costPrice: Number(prod.costPrice),
        salePrice: Number(prod.salePrice),
        currentQuantity: Number(prod.currentQuantity || 0),
        minimumQuantity: Number(prod.minimumQuantity || 0),
        unit: prod.unit || 'Un',
        active: prod.active !== false,
      };
      stock.push(resultProd);
    }
  } else {
    resultProd = {
      id: 'prod_' + Date.now(),
      companyId: 'comp_1',
      code: prod.code || '',
      name: prod.name,
      category: prod.category,
      description: prod.description || '',
      supplier: prod.supplier || '',
      costPrice: Number(prod.costPrice),
      salePrice: Number(prod.salePrice),
      currentQuantity: Number(prod.currentQuantity || 0),
      minimumQuantity: Number(prod.minimumQuantity || 0),
      unit: prod.unit || 'Un',
      active: true,
    };
    stock.push(resultProd);
  }

  setItem(STORAGE_KEYS.STOCK, stock);
  safeDb(supabase.from('stock_products').upsert(mapStockToDb(resultProd)));
  return resultProd;
}

export function addStockMovement(
  productId: string,
  type: StockMovement['type'],
  quantity: number,
  reason: string,
  userName = 'Vinícius'
): void {
  const stock = getStockProducts();
  const prodIndex = stock.findIndex((p) => p.id === productId);
  if (prodIndex < 0) return;

  const prod = stock[prodIndex];
  let qtyChange = quantity;

  if (type === 'saida' || type === 'uso_servico') {
    qtyChange = -quantity;
  } else if (type === 'ajuste') {
    qtyChange = quantity - prod.currentQuantity;
  }

  prod.currentQuantity = Math.max(0, prod.currentQuantity + qtyChange);
  stock[prodIndex] = prod;
  setItem(STORAGE_KEYS.STOCK, stock);
  safeDb(supabase.from('stock_products').upsert(mapStockToDb(prod)));

  const movements = getStockMovements();
  const newMovement: StockMovement = {
    id: 'mov_' + Date.now(),
    companyId: 'comp_1',
    productId,
    productName: prod.name,
    type,
    quantity,
    date: getTodayString(),
    reason,
    userName,
  };
  movements.unshift(newMovement);
  setItem(STORAGE_KEYS.STOCK_MOVEMENTS, movements);
  safeDb(supabase.from('stock_movements').upsert(mapMovementToDb(newMovement)));
}

// QUOTES
export function getQuotes(): Quote[] {
  return getItem<Quote[]>(STORAGE_KEYS.QUOTES, []);
}

export function saveQuote(quote: Partial<Quote> & { clientId: string; vehicleId: string }): Quote {
  const quotes = getQuotes();
  const now = getTodayString();
  let resultQuote: Quote;

  if (quote.id) {
    const index = quotes.findIndex((q) => q.id === quote.id);
    if (index >= 0) {
      quotes[index] = { ...quotes[index], ...quote };
      resultQuote = quotes[index];
    } else {
      resultQuote = {
        id: quote.id,
        companyId: quote.companyId || 'comp_1',
        code: quote.code || `ORC-${1000 + quotes.length + 1}`,
        clientId: quote.clientId,
        vehicleId: quote.vehicleId,
        date: quote.date || now,
        validUntil: quote.validUntil || addDaysToDate(now, 10),
        items: quote.items || [],
        laborCost: Number(quote.laborCost || 0),
        discount: Number(quote.discount || 0),
        totalAmount: Number(quote.totalAmount || 0),
        status: quote.status || 'rascunho',
        notes: quote.notes || '',
        createdAt: quote.createdAt || now,
      };
      quotes.unshift(resultQuote);
    }
  } else {
    const code = `ORC-${1000 + quotes.length + 1}`;
    resultQuote = {
      id: 'orc_' + Date.now(),
      companyId: 'comp_1',
      code,
      clientId: quote.clientId,
      vehicleId: quote.vehicleId,
      date: quote.date || now,
      validUntil: quote.validUntil || addDaysToDate(now, 10),
      items: quote.items || [],
      laborCost: Number(quote.laborCost || 0),
      discount: Number(quote.discount || 0),
      totalAmount: Number(quote.totalAmount || 0),
      status: quote.status || 'rascunho',
      notes: quote.notes || '',
      createdAt: now,
    };
    quotes.unshift(resultQuote);
  }

  setItem(STORAGE_KEYS.QUOTES, quotes);
  safeDb(supabase.from('quotes').upsert(mapQuoteToDb(resultQuote)));
  return resultQuote;
}

// WORK ORDERS
export function getWorkOrders(): WorkOrder[] {
  return getItem<WorkOrder[]>(STORAGE_KEYS.WORK_ORDERS, []);
}

export function saveWorkOrder(wo: Partial<WorkOrder> & { clientId: string; vehicleId: string }): WorkOrder {
  const orders = getWorkOrders();
  const now = getTodayString();
  let resultOrder: WorkOrder;

  if (wo.id) {
    const index = orders.findIndex((o) => o.id === wo.id);
    if (index >= 0) {
      const prevOrder = orders[index];
      const updatedOrder = { ...prevOrder, ...wo };

      if (prevOrder.status !== 'finalizado' && updatedOrder.status === 'finalizado') {
        finalizeWorkOrderTriggers(updatedOrder);
      }

      orders[index] = updatedOrder;
      resultOrder = updatedOrder;
    } else {
      resultOrder = {
        id: wo.id,
        companyId: wo.companyId || 'comp_1',
        code: wo.code || `OS-${1000 + orders.length + 1}`,
        clientId: wo.clientId,
        vehicleId: wo.vehicleId,
        date: wo.date || now,
        mileage: Number(wo.mileage || 0),
        clientComplaint: wo.clientComplaint || '',
        diagnosis: wo.diagnosis || '',
        items: wo.items || [],
        laborCost: Number(wo.laborCost || 0),
        discount: Number(wo.discount || 0),
        totalAmount: Number(wo.totalAmount || 0),
        paymentMethod: wo.paymentMethod || 'pix',
        status: wo.status || 'aberto',
        warrantyDays: Number(wo.warrantyDays || 90),
        nextReturnDate: wo.nextReturnDate || addMonthsToDate(now, 6),
        notes: wo.notes || '',
        createdAt: wo.createdAt || now,
      };
      orders.unshift(resultOrder);
    }
  } else {
    const code = `OS-${1000 + orders.length + 1}`;
    resultOrder = {
      id: 'os_' + Date.now(),
      companyId: 'comp_1',
      code,
      clientId: wo.clientId,
      vehicleId: wo.vehicleId,
      date: wo.date || now,
      mileage: Number(wo.mileage || 0),
      clientComplaint: wo.clientComplaint || '',
      diagnosis: wo.diagnosis || '',
      items: wo.items || [],
      laborCost: Number(wo.laborCost || 0),
      discount: Number(wo.discount || 0),
      totalAmount: Number(wo.totalAmount || 0),
      paymentMethod: wo.paymentMethod || 'pix',
      status: wo.status || 'aberto',
      warrantyDays: Number(wo.warrantyDays || 90),
      nextReturnDate: wo.nextReturnDate || addMonthsToDate(now, 6),
      notes: wo.notes || '',
      createdAt: now,
    };

    if (resultOrder.status === 'finalizado') {
      finalizeWorkOrderTriggers(resultOrder);
    }

    orders.unshift(resultOrder);
  }

  setItem(STORAGE_KEYS.WORK_ORDERS, orders);
  safeDb(supabase.from('work_orders').upsert(mapWorkOrderToDb(resultOrder)));
  return resultOrder;
}

function finalizeWorkOrderTriggers(order: WorkOrder) {
  const today = getTodayString();
  order.completedAt = today;

  // 1. Update Vehicle Mileage
  const vehicles = getVehicles();
  const vIndex = vehicles.findIndex((v) => v.id === order.vehicleId);
  if (vIndex >= 0 && order.mileage > vehicles[vIndex].mileage) {
    vehicles[vIndex].mileage = order.mileage;
    setItem(STORAGE_KEYS.VEHICLES, vehicles);
    safeDb(supabase.from('vehicles').upsert(mapVehicleToDb(vehicles[vIndex])));
  }

  // 2. Deduct Used Parts from Stock
  order.items.forEach((item) => {
    if (item.type === 'peca' && item.refId) {
      addStockMovement(item.refId, 'uso_servico', item.quantity, `Uso em serviço OS ${order.code}`);
    }
  });

  // 3. Financial Transaction
  if (order.paymentMethod !== 'prazo') {
    saveFinancialTransaction({
      type: 'entrada',
      description: `Recebimento Ordem de Serviço ${order.code}`,
      clientId: order.clientId,
      workOrderId: order.id,
      category: 'Serviços de Ar-Condicionado',
      amount: order.totalAmount,
      date: today,
      paymentMethod: order.paymentMethod,
      status: 'pago',
    });
  }

  // 4. Create Post-Service Follow-Up Reminder
  const settings = getCompanySettings();
  const reminderDate = addDaysToDate(today, settings.postServiceFollowUpDays || 3);
  const followUps = getItem<FollowUp[]>(STORAGE_KEYS.FOLLOWUPS, []);
  const newFollowUp: FollowUp = {
    id: 'fol_' + Date.now(),
    companyId: 'comp_1',
    workOrderId: order.id,
    clientId: order.clientId,
    vehicleId: order.vehicleId,
    serviceDate: today,
    reminderDate,
    status: 'pendente',
    notes: 'Acompanhamento pós-atendimento automático.',
  };
  followUps.unshift(newFollowUp);
  setItem(STORAGE_KEYS.FOLLOWUPS, followUps);
  safeDb(supabase.from('follow_ups').upsert(mapFollowUpToDb(newFollowUp)));

  // 5. Create Maintenance Return Reminder
  if (order.nextReturnDate) {
    const serviceItem = order.items.find((i) => i.type === 'servico');
    const serviceName = serviceItem ? serviceItem.description : 'Manutenção de Ar-Condicionado';
    const reminders = getItem<MaintenanceReminder[]>(STORAGE_KEYS.MAINTENANCE, []);
    const newReminder: MaintenanceReminder = {
      id: 'rem_' + Date.now(),
      companyId: 'comp_1',
      clientId: order.clientId,
      vehicleId: order.vehicleId,
      serviceName,
      lastServiceDate: today,
      dueDate: order.nextReturnDate,
      status: 'pendente',
      notes: `Previsão de retorno para ${serviceName}`,
    };
    reminders.unshift(newReminder);
    setItem(STORAGE_KEYS.MAINTENANCE, reminders);
    safeDb(supabase.from('maintenance_reminders').upsert(mapReminderToDb(newReminder)));
  }
}

// CONVERT QUOTE TO WORK ORDER
export function convertQuoteToWorkOrder(quoteId: string): WorkOrder | null {
  const quotes = getQuotes();
  const qIndex = quotes.findIndex((q) => q.id === quoteId);
  if (qIndex < 0) return null;

  const quote = quotes[qIndex];
  quote.status = 'convertido';
  quotes[qIndex] = quote;
  setItem(STORAGE_KEYS.QUOTES, quotes);
  safeDb(supabase.from('quotes').upsert(mapQuoteToDb(quote)));

  const vehicle = getVehicles().find((v) => v.id === quote.vehicleId);

  return saveWorkOrder({
    clientId: quote.clientId,
    vehicleId: quote.vehicleId,
    mileage: vehicle?.mileage || 0,
    clientComplaint: `Convertido do Orçamento ${quote.code}`,
    items: quote.items,
    laborCost: quote.laborCost,
    discount: quote.discount,
    totalAmount: quote.totalAmount,
    status: 'aberto',
    paymentMethod: 'pix',
    warrantyDays: 90,
  });
}

// FINANCIAL TRANSACTIONS
export function getFinancialTransactions(): FinancialTransaction[] {
  return getItem<FinancialTransaction[]>(STORAGE_KEYS.FINANCIALS, []);
}

export function saveFinancialTransaction(
  t: Partial<FinancialTransaction> & { type: 'entrada' | 'saida'; description: string; amount: number }
): FinancialTransaction {
  const transactions = getFinancialTransactions();
  const now = getTodayString();
  let resultT: FinancialTransaction;

  if (t.id) {
    const index = transactions.findIndex((item) => item.id === t.id);
    if (index >= 0) {
      transactions[index] = { ...transactions[index], ...t };
      resultT = transactions[index];
    } else {
      resultT = {
        id: t.id,
        companyId: t.companyId || 'comp_1',
        type: t.type,
        description: t.description,
        clientId: t.clientId,
        workOrderId: t.workOrderId,
        category: t.category || (t.type === 'entrada' ? 'Serviços' : 'Outros'),
        amount: Number(t.amount),
        date: t.date || now,
        dueDate: t.dueDate || t.date || now,
        paymentMethod: t.paymentMethod || 'pix',
        status: t.status || 'pago',
        notes: t.notes || '',
        createdAt: t.createdAt || now,
      };
      transactions.unshift(resultT);
    }
  } else {
    resultT = {
      id: 'fin_' + Date.now(),
      companyId: 'comp_1',
      type: t.type,
      description: t.description,
      clientId: t.clientId,
      workOrderId: t.workOrderId,
      category: t.category || (t.type === 'entrada' ? 'Serviços' : 'Outros'),
      amount: Number(t.amount),
      date: t.date || now,
      dueDate: t.dueDate || t.date || now,
      paymentMethod: t.paymentMethod || 'pix',
      status: t.status || 'pago',
      notes: t.notes || '',
      createdAt: now,
    };
    transactions.unshift(resultT);
  }

  setItem(STORAGE_KEYS.FINANCIALS, transactions);
  safeDb(supabase.from('financial_transactions').upsert(mapFinancialToDb(resultT)));
  return resultT;
}

// ACCOUNTS RECEIVABLE & INSTALLMENTS
export function getAccountsReceivable(): AccountsReceivable[] {
  return getItem<AccountsReceivable[]>(STORAGE_KEYS.RECEIVABLES, []);
}

export function saveAccountsReceivable(
  rec: Partial<AccountsReceivable> & {
    clientId: string;
    totalAmount: number;
    downPayment: number;
    installmentsCount: number;
    firstDueDate?: string;
  }
): AccountsReceivable {
  const list = getAccountsReceivable();
  const now = getTodayString();

  const remaining = Math.max(0, rec.totalAmount - rec.downPayment);
  const count = Math.max(1, rec.installmentsCount);
  const installmentValue = Math.round((remaining / count) * 100) / 100;

  const installments =
    rec.installments && rec.installments.length > 0
      ? rec.installments
      : Array.from({ length: count }, (_, i) => {
          const dueDate = addMonthsToDate(rec.firstDueDate || now, i);
          return {
            number: i + 1,
            amount: installmentValue,
            dueDate,
            status: 'a_vencer' as const,
          };
        });

  const newRec: AccountsReceivable = {
    id: rec.id || 'rec_' + Date.now(),
    companyId: 'comp_1',
    workOrderId: rec.workOrderId,
    clientId: rec.clientId,
    description: rec.description || `Parcelamento de R$ ${rec.totalAmount}`,
    totalAmount: rec.totalAmount,
    downPayment: rec.downPayment,
    installmentsCount: count,
    installments,
    status: rec.status || 'em_aberto',
    createdAt: rec.createdAt || now,
  };

  const existingIndex = list.findIndex((r) => r.id === newRec.id);
  if (existingIndex >= 0) {
    list[existingIndex] = newRec;
  } else {
    list.unshift(newRec);
  }

  setItem(STORAGE_KEYS.RECEIVABLES, list);
  safeDb(supabase.from('accounts_receivable').upsert(mapReceivableToDb(newRec)));
  return newRec;
}

export function payInstallment(receivableId: string, installmentNumber: number): void {
  const list = getAccountsReceivable();
  const index = list.findIndex((r) => r.id === receivableId);
  if (index < 0) return;

  const rec = list[index];
  const instIndex = rec.installments.findIndex((i) => i.number === installmentNumber);
  if (instIndex < 0) return;

  rec.installments[instIndex].status = 'pago';
  rec.installments[instIndex].paidDate = getTodayString();

  const allPaid = rec.installments.every((i) => i.status === 'pago');
  if (allPaid) {
    rec.status = 'quitado';
  }

  list[index] = rec;
  setItem(STORAGE_KEYS.RECEIVABLES, list);
  safeDb(supabase.from('accounts_receivable').upsert(mapReceivableToDb(rec)));

  saveFinancialTransaction({
    type: 'entrada',
    description: `Recebimento Parcela ${installmentNumber}/${rec.installmentsCount} (${rec.description})`,
    clientId: rec.clientId,
    workOrderId: rec.workOrderId,
    category: 'Recebimento de Parcelas',
    amount: rec.installments[instIndex].amount,
    date: getTodayString(),
    paymentMethod: 'pix',
    status: 'pago',
  });
}

// MAINTENANCE & FOLLOW-UPS
export function getMaintenanceReminders(): MaintenanceReminder[] {
  return getItem<MaintenanceReminder[]>(STORAGE_KEYS.MAINTENANCE, []);
}

export function updateMaintenanceReminderStatus(id: string, status: MaintenanceReminder['status']): void {
  const reminders = getMaintenanceReminders();
  const index = reminders.findIndex((r) => r.id === id);
  if (index >= 0) {
    reminders[index].status = status;
    reminders[index].lastContactDate = getTodayString();
    setItem(STORAGE_KEYS.MAINTENANCE, reminders);
    safeDb(supabase.from('maintenance_reminders').upsert(mapReminderToDb(reminders[index])));
  }
}

export function getFollowUps(): FollowUp[] {
  return getItem<FollowUp[]>(STORAGE_KEYS.FOLLOWUPS, []);
}

export function updateFollowUpStatus(id: string, status: FollowUp['status']): void {
  const followUps = getFollowUps();
  const index = followUps.findIndex((f) => f.id === id);
  if (index >= 0) {
    followUps[index].status = status;
    followUps[index].lastContactDate = getTodayString();
    setItem(STORAGE_KEYS.FOLLOWUPS, followUps);
    safeDb(supabase.from('follow_ups').upsert(mapFollowUpToDb(followUps[index])));
  }
}

// MESSAGE TEMPLATES
export function getMessageTemplates(): MessageTemplate[] {
  return getItem<MessageTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
}

export function saveMessageTemplate(tmpl: MessageTemplate): void {
  const templates = getMessageTemplates();
  const index = templates.findIndex((t) => t.id === tmpl.id);
  if (index >= 0) {
    templates[index] = tmpl;
  } else {
    templates.push(tmpl);
  }
  setItem(STORAGE_KEYS.TEMPLATES, templates);
  safeDb(supabase.from('message_templates').upsert(mapTemplateToDb(tmpl)));
}
