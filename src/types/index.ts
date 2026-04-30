export type ClientStatus = 'active' | 'paused' | 'churned';
export type ContractType = 'fixed' | 'project' | 'recurring-variable';
export type PipelineStage = 'lead' | 'contact' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Client {
  id: string;
  company: string;
  contactName: string;
  phone: string;
  email: string;
  monthlyValue: number;
  contractType: ContractType;
  contractStart: string; // ISO date
  contractEnd: string;   // ISO date
  status: ClientStatus;
  pipelineStage: PipelineStage;
  source?: string;       // Onde o lead veio (Indicação, Instagram, etc.)
  estimatedValue?: number; // Valor potencial do contrato
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  createdAt: string;
}

export type PaymentStatus = 'pending' | 'paid-by-client' | 'confirmed';
export type ReceiveType = 'fixed' | 'variable' | 'one-time';
export type ReceiveMethod = 'pix' | 'ted' | 'boleto' | 'card' | 'other';

export interface Receivable {
  id: string;
  clientId: string;
  description: string;
  type: ReceiveType;
  amount: number;
  competenceMonth: string; // YYYY-MM
  dueDate: string;         // ISO date
  receivedDate?: string;   // ISO date
  status: PaymentStatus;
  method: ReceiveMethod;
  notes?: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'employee'
  | 'investment'
  | 'software'
  | 'rent'
  | 'taxes'
  | 'marketing'
  | 'services'
  | 'other';

export type ExpenseStatus = 'pending' | 'paid' | 'confirmed';
export type ExpenseFlavor = 'fixed' | 'variable';
export type PayMethod = 'pix' | 'ted' | 'boleto' | 'card' | 'debit' | 'other';

export interface Payable {
  id: string;
  description: string;
  category: ExpenseCategory;
  customCategory?: string;
  flavor: ExpenseFlavor;
  amount: number;
  competenceMonth: string;
  dueDate: string;
  paidDate?: string;
  status: ExpenseStatus;
  vendor: string;
  method: PayMethod;
  recurring: boolean;
  linkedClientId?: string;
  notes?: string;
  createdAt: string;
}

export type CalendarEventType = 'meeting' | 'task' | 'reminder' | 'deadline' | 'milestone';
export type CalendarEventPriority = 'low' | 'medium' | 'high';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;          // ISO yyyy-mm-dd
  startTime?: string;    // HH:mm (24h)
  endTime?: string;      // HH:mm
  allDay: boolean;
  type: CalendarEventType;
  priority: CalendarEventPriority;
  location?: string;
  clientId?: string;
  completed: boolean;
  createdAt: string;
}

export type Theme = 'dark' | 'light';
export type PeriodGrain = 'day' | 'week' | 'month' | 'year';

export interface AppMeta {
  id: 'singleton';
  theme: Theme;
  selectedMonth: string;        // YYYY-MM
  cashflowNotesByMonth: Record<string, string>;
  customExpenseCategories: string[];
}
