/**
 * Format currency to Brazilian Real (R$)
 */
export function formatCurrency(value: number): string {
  if (isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Format date YYYY-MM-DD to DD/MM/YYYY
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  const parts = dateString.split('T')[0].split('-');
  if (parts.length !== 3) return dateString;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

/**
 * Format today date as YYYY-MM-DD
 */
export function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add days to YYYY-MM-DD
 */
export function addDaysToDate(dateString: string, days: number): string {
  const date = new Date(dateString + 'T12:00:00');
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add months to YYYY-MM-DD
 */
export function addMonthsToDate(dateString: string, months: number): string {
  const date = new Date(dateString + 'T12:00:00');
  date.setMonth(date.getMonth() + months);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format Brazilian phone number
 */
export function formatPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  } else if (digits.length === 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  return phone;
}

/**
 * Format CPF or CNPJ
 */
export function formatCpfCnpj(value?: string): string {
  if (!value) return '-';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  } else if (digits.length === 14) {
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  return value;
}

/**
 * Normalize and format License Plate (Mercosul ABC1D23 or standard ABC1234)
 */
export function normalizePlate(plate: string): string {
  if (!plate) return '';
  const clean = plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (clean.length === 7) {
    // Check if traditional ABC1234 format or Mercosul ABC1D23
    return clean;
  }
  return clean;
}

/**
 * Build WhatsApp Web / App direct link
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  // Add Brazil country code +55 if omitted
  const fullPhone = digits.length <= 11 ? `55${digits}` : digits;
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${fullPhone}?text=${encodedText}`;
}

/**
 * Replace template variables with real client/vehicle values
 */
export interface TemplateVariables {
  cliente?: string;
  veiculo?: string;
  placa?: string;
  servico?: string;
  data?: string;
  empresa?: string;
  valor?: string;
}

export function replaceTemplateVars(template: string, vars: TemplateVariables): string {
  let result = template;
  if (vars.cliente) result = result.replace(/{cliente}/g, vars.cliente);
  if (vars.veiculo) result = result.replace(/{veiculo}/g, vars.veiculo);
  if (vars.placa) result = result.replace(/{placa}/g, vars.placa);
  if (vars.servico) result = result.replace(/{servico}/g, vars.servico);
  if (vars.data) result = result.replace(/{data}/g, vars.data);
  if (vars.empresa) result = result.replace(/{empresa}/g, vars.empresa);
  if (vars.valor) result = result.replace(/{valor}/g, vars.valor);
  return result;
}
