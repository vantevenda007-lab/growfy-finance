import { format, parseISO, isValid, differenceInDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatBRLCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(1)}k`;
  }
  return formatBRL(value);
}

export function formatPercent(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits).replace('.', ',')}%`;
}

export function formatDate(iso: string | undefined, pattern = 'dd MMM yyyy'): string {
  if (!iso) return '—';
  const date = parseISO(iso);
  return isValid(date) ? format(date, pattern, { locale: ptBR }) : '—';
}

export function formatMonthLabel(iso: string): string {
  const date = parseISO(iso);
  if (!isValid(date)) return iso;
  return format(date, 'MMMM yyyy', { locale: ptBR });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7); // YYYY-MM
}

export function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

export function monthBounds(monthIso: string): { start: Date; end: Date } {
  const date = parseISO(`${monthIso}-01`);
  return { start: startOfMonth(date), end: endOfMonth(date) };
}

export function previousMonthKeys(count: number, fromMonth?: string): string[] {
  const base = fromMonth ? parseISO(`${fromMonth}-01`) : new Date();
  return Array.from({ length: count }, (_, i) =>
    format(subMonths(base, count - 1 - i), 'yyyy-MM'),
  );
}

export function daysUntil(iso: string): number {
  if (!iso) return 0;
  const date = parseISO(iso);
  if (!isValid(date)) return 0;
  return differenceInDays(date, new Date());
}

export function digitsOnly(input: string): string {
  return input.replace(/\D/g, '');
}

export function whatsappLink(phone: string): string {
  const digits = digitsOnly(phone);
  return `https://wa.me/${digits.startsWith('55') ? digits : `55${digits}`}`;
}
