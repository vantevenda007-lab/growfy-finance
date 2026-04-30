import type { Client, Payable, Receivable } from '@/types';
import { daysUntil, monthBounds, previousMonthKeys } from './format';
import { isAfter, isBefore, parseISO } from 'date-fns';

export interface MonthSummary {
  month: string;
  grossRevenue: number;
  recurringRevenue: number;
  variableRevenue: number;
  totalExpenses: number;
  fixedExpenses: number;
  variableExpenses: number;
  expectedProfit: number;
  marginPct: number;

  receivedConfirmed: number;
  toReceive: number;
  paidConfirmed: number;
  toPay: number;
  availableBalance: number;
  projectedClosingBalance: number;
}

export function summarizeMonth(month: string, receivables: Receivable[], payables: Payable[]): MonthSummary {
  const inMonth = <T extends { competenceMonth: string }>(rows: T[]): T[] =>
    rows.filter((r) => r.competenceMonth === month);

  const recRows = inMonth(receivables);
  const payRows = inMonth(payables);

  const grossRevenue = sum(recRows.map((r) => r.amount));
  const recurringRevenue = sum(recRows.filter((r) => r.type === 'fixed').map((r) => r.amount));
  const variableRevenue = grossRevenue - recurringRevenue;

  const totalExpenses = sum(payRows.map((p) => p.amount));
  const fixedExpenses = sum(payRows.filter((p) => p.flavor === 'fixed').map((p) => p.amount));
  const variableExpenses = totalExpenses - fixedExpenses;

  const expectedProfit = grossRevenue - totalExpenses;
  const marginPct = grossRevenue > 0 ? (expectedProfit / grossRevenue) * 100 : 0;

  const receivedConfirmed = sum(recRows.filter((r) => r.status === 'confirmed').map((r) => r.amount));
  const toReceive = grossRevenue - receivedConfirmed;
  const paidConfirmed = sum(payRows.filter((p) => p.status === 'confirmed').map((p) => p.amount));
  const toPay = totalExpenses - paidConfirmed;
  const availableBalance = receivedConfirmed - paidConfirmed;
  const projectedClosingBalance = grossRevenue - totalExpenses;

  return {
    month,
    grossRevenue,
    recurringRevenue,
    variableRevenue,
    totalExpenses,
    fixedExpenses,
    variableExpenses,
    expectedProfit,
    marginPct,
    receivedConfirmed,
    toReceive,
    paidConfirmed,
    toPay,
    availableBalance,
    projectedClosingBalance,
  };
}

export function sixMonthSeries(currentMonth: string, receivables: Receivable[], payables: Payable[]): {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}[] {
  const months = previousMonthKeys(6, currentMonth);
  return months.map((m) => {
    const summary = summarizeMonth(m, receivables, payables);
    return {
      month: m,
      revenue: summary.grossRevenue,
      expenses: summary.totalExpenses,
      profit: summary.expectedProfit,
    };
  });
}

export function expenseCategoryBreakdown(month: string, payables: Payable[]): { category: string; amount: number }[] {
  const monthRows = payables.filter((p) => p.competenceMonth === month);
  const map = new Map<string, number>();
  for (const row of monthRows) {
    const key = row.category === 'other' && row.customCategory ? row.customCategory : row.category;
    map.set(key, (map.get(key) ?? 0) + row.amount);
  }
  return Array.from(map.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export interface AlertEvent {
  id: string;
  kind: 'receive-due' | 'pay-due' | 'overdue' | 'contract-renewal';
  label: string;
  amount?: number;
  daysUntil: number;
}

export function buildAlerts(clients: Client[], receivables: Receivable[], payables: Payable[]): AlertEvent[] {
  const alerts: AlertEvent[] = [];

  for (const r of receivables) {
    if (r.status === 'confirmed') continue;
    const days = daysUntil(r.dueDate);
    const client = clients.find((c) => c.id === r.clientId);
    if (days < 0) {
      alerts.push({
        id: `over-${r.id}`,
        kind: 'overdue',
        label: `${client?.company ?? 'Cliente'} — ${r.description} em atraso`,
        amount: r.amount,
        daysUntil: days,
      });
    } else if (days <= 7) {
      alerts.push({
        id: `rec-${r.id}`,
        kind: 'receive-due',
        label: `${client?.company ?? 'Cliente'} — ${r.description}`,
        amount: r.amount,
        daysUntil: days,
      });
    }
  }

  for (const p of payables) {
    if (p.status === 'confirmed') continue;
    const days = daysUntil(p.dueDate);
    if (days >= 0 && days <= 7) {
      alerts.push({
        id: `pay-${p.id}`,
        kind: 'pay-due',
        label: `${p.vendor} — ${p.description}`,
        amount: p.amount,
        daysUntil: days,
      });
    }
  }

  for (const c of clients) {
    if (c.status !== 'active') continue;
    const days = daysUntil(c.contractEnd);
    if (days >= 0 && days <= 30) {
      alerts.push({
        id: `contract-${c.id}`,
        kind: 'contract-renewal',
        label: `${c.company} — renovação em ${days} dia${days === 1 ? '' : 's'}`,
        daysUntil: days,
      });
    }
  }

  return alerts.sort((a, b) => a.daysUntil - b.daysUntil);
}

export function clientHistory(clientId: string, receivables: Receivable[]): {
  totalReceived: number;
  totalOpen: number;
  monthsOfRelationship: number;
  averageTicket: number;
  rows: Receivable[];
} {
  const rows = receivables
    .filter((r) => r.clientId === clientId)
    .sort((a, b) => (a.competenceMonth < b.competenceMonth ? 1 : -1));
  const totalReceived = sum(rows.filter((r) => r.status === 'confirmed').map((r) => r.amount));
  const totalOpen = sum(rows.filter((r) => r.status !== 'confirmed').map((r) => r.amount));
  const months = new Set(rows.map((r) => r.competenceMonth));
  const monthsOfRelationship = months.size;
  const averageTicket = rows.length > 0 ? sum(rows.map((r) => r.amount)) / rows.length : 0;
  return { totalReceived, totalOpen, monthsOfRelationship, averageTicket, rows };
}

export function timelineForMonth(month: string, receivables: Receivable[], payables: Payable[]): {
  date: string;
  kind: 'in' | 'out';
  label: string;
  amount: number;
  status: string;
}[] {
  const { start, end } = monthBounds(month);
  const events: { date: string; kind: 'in' | 'out'; label: string; amount: number; status: string }[] = [];

  for (const r of receivables.filter((r) => r.competenceMonth === month)) {
    const date = parseISO(r.dueDate);
    if (isBefore(date, start) || isAfter(date, end)) continue;
    events.push({ date: r.dueDate, kind: 'in', label: r.description, amount: r.amount, status: r.status });
  }
  for (const p of payables.filter((p) => p.competenceMonth === month)) {
    const date = parseISO(p.dueDate);
    if (isBefore(date, start) || isAfter(date, end)) continue;
    events.push({ date: p.dueDate, kind: 'out', label: `${p.vendor} — ${p.description}`, amount: p.amount, status: p.status });
  }

  return events.sort((a, b) => (a.date < b.date ? -1 : 1));
}

function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}
