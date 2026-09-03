export type UserRole = 'admin' | 'funcionario';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
}

export interface CompanySettings {
  id: string;
  name: string;
  tradeName: string;
  cnpjCpf: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  state: string;
  cep: string;
  logoUrl?: string;
  postServiceFollowUpDays: number;
  footerText: string;
  birthdayMsgTemplate: string;
  followUpMsgTemplate: string;
  maintenanceMsgTemplate: string;
  duePaymentMsgTemplate: string;
}

export interface Client {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  whatsapp: string;
  cpfCnpj?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  cep?: string;
  birthDay?: number; // 1-31
  birthMonth?: number; // 1-12
  notes?: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  clientId: string;
  companyId: string;
  plate: string; // E.g. ABC1D23 or ABC1234 (normalized uppercase)
  make: string; // E.g. Chevrolet
  model: string; // E.g. Onix
  version?: string; // E.g. 1.0 Turbo LTZ
  year: number; // E.g. 2021
  color?: string; // E.g. Prata
  mileage: number; // E.g. 45000
  notes?: string;
  createdAt: string;
}

export interface ServiceCatalog {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  defaultPrice: number;
  estimatedTimeMinutes?: number;
  hasPeriodicReturn: boolean;
  returnQuantity?: number;
  returnUnit?: 'dias' | 'meses' | 'anos';
}

export interface StockProduct {
  id: string;
  companyId: string;
  code?: string;
  name: string;
  category: string; // E.g. Filtros, Óleos, Gás Refrigerante, Peças
  description?: string;
  supplier?: string;
  costPrice: number;
  salePrice: number;
  currentQuantity: number;
  minimumQuantity: number;
  unit: string; // E.g. Un, Kg, L, Can
  active: boolean;
}

export type StockMovementType = 'entrada' | 'saida' | 'ajuste' | 'uso_servico';

export interface StockMovement {
  id: string;
  companyId: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantity: number;
  date: string; // YYYY-MM-DD
  reason: string;
  userName: string;
}

export type QuoteStatus = 'rascunho' | 'enviado' | 'aprovado' | 'recusado' | 'convertido';

export interface OrderItem {
  id: string;
  type: 'servico' | 'peca';
  refId?: string; // ServiceCatalog ID or StockProduct ID
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Quote {
  id: string;
  companyId: string;
  code: string; // E.g. ORC-1001
  clientId: string;
  vehicleId: string;
  date: string; // YYYY-MM-DD
  validUntil: string; // YYYY-MM-DD
  items: OrderItem[];
  laborCost: number;
  discount: number;
  totalAmount: number;
  status: QuoteStatus;
  notes?: string;
  createdAt: string;
}

export type WorkOrderStatus = 'aberto' | 'em_andamento' | 'finalizado' | 'cancelado';
export type PaymentMethod = 'pix' | 'dinheiro' | 'debito' | 'credito' | 'transferencia' | 'prazo';

export interface WorkOrder {
  id: string;
  companyId: string;
  code: string; // E.g. OS-2001
  clientId: string;
  vehicleId: string;
  date: string; // YYYY-MM-DD
  mileage: number;
  clientComplaint?: string;
  diagnosis?: string;
  items: OrderItem[];
  laborCost: number;
  discount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: WorkOrderStatus;
  warrantyDays: number;
  nextReturnDate?: string; // YYYY-MM-DD
  notes?: string;
  completedAt?: string;
  createdAt: string;
}

export type TransactionType = 'entrada' | 'saida';
export type TransactionStatus = 'pago' | 'pendente' | 'cancelado';

export interface FinancialTransaction {
  id: string;
  companyId: string;
  type: TransactionType;
  description: string;
  clientId?: string;
  workOrderId?: string;
  category: string; // E.g. Serviços, Peças, Aluguel, Energia, Salários, Impostos, Outros
  amount: number;
  date: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  notes?: string;
  createdAt: string;
}

export type InstallmentStatus = 'a_vencer' | 'vencido' | 'pago';

export interface PaymentInstallment {
  number: number;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  paidDate?: string; // YYYY-MM-DD
  status: InstallmentStatus;
}

export interface AccountsReceivable {
  id: string;
  companyId: string;
  workOrderId?: string;
  clientId: string;
  description: string;
  totalAmount: number;
  downPayment: number;
  installmentsCount: number;
  installments: PaymentInstallment[];
  status: 'em_aberto' | 'quitado' | 'cancelado';
  createdAt: string;
}

export type MaintenanceReminderStatus = 'pendente' | 'contatado' | 'agendou' | 'nao_interessado' | 'adiado';

export interface MaintenanceReminder {
  id: string;
  companyId: string;
  clientId: string;
  vehicleId: string;
  serviceName: string;
  lastServiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status: MaintenanceReminderStatus;
  notes?: string;
  lastContactDate?: string;
}

export type FollowUpStatus = 'pendente' | 'contatado' | 'problema' | 'sem_resposta';

export interface FollowUp {
  id: string;
  companyId: string;
  workOrderId: string;
  clientId: string;
  vehicleId: string;
  serviceDate: string;
  reminderDate: string; // YYYY-MM-DD (e.g. +3 days)
  status: FollowUpStatus;
  notes?: string;
  lastContactDate?: string;
}

export type TemplateCategory = 'aniversario' | 'manutencao' | 'pos_venda' | 'orcamento' | 'cobranca';

export interface MessageTemplate {
  id: string;
  companyId: string;
  category: TemplateCategory;
  title: string;
  content: string;
}
