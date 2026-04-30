import { create } from 'zustand';
import { db } from '@/lib/db';
import { currentMonthKey } from '@/lib/format';
import type {
  AppMeta,
  CalendarEvent,
  Client,
  Payable,
  PeriodGrain,
  Receivable,
  Theme,
} from '@/types';

const SEED_CLEARED_FLAG = 'growfy.cleared.seed.v1';

interface AppState {
  // Data
  clients: Client[];
  receivables: Receivable[];
  payables: Payable[];
  events: CalendarEvent[];

  // UI state
  theme: Theme;
  selectedMonth: string;
  periodGrain: PeriodGrain;
  cashflowNotesByMonth: Record<string, string>;
  customExpenseCategories: string[];
  hydrated: boolean;

  // Actions
  hydrate: () => Promise<void>;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSelectedMonth: (month: string) => void;
  setPeriodGrain: (g: PeriodGrain) => void;

  upsertClient: (client: Client) => Promise<void>;
  removeClient: (id: string) => Promise<void>;

  upsertReceivable: (r: Receivable) => Promise<void>;
  removeReceivable: (id: string) => Promise<void>;

  upsertPayable: (p: Payable) => Promise<void>;
  removePayable: (id: string) => Promise<void>;

  upsertEvent: (e: CalendarEvent) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;

  setCashflowNote: (month: string, note: string) => Promise<void>;
  addCustomCategory: (label: string) => Promise<void>;

  resetSeed: () => Promise<void>;
  replaceAll: (data: { clients: Client[]; receivables: Receivable[]; payables: Payable[]; events: CalendarEvent[]; meta: AppMeta | null }) => Promise<void>;
}

const META_ID = 'singleton' as const;

let hydrationInFlight = false;

function defaultMeta(): AppMeta {
  return {
    id: META_ID,
    theme: 'dark',
    selectedMonth: currentMonthKey(),
    cashflowNotesByMonth: {},
    customExpenseCategories: [],
  };
}

async function persistMeta(state: Pick<AppState, 'theme' | 'selectedMonth' | 'cashflowNotesByMonth' | 'customExpenseCategories'>): Promise<void> {
  const meta: AppMeta = {
    id: META_ID,
    theme: state.theme,
    selectedMonth: state.selectedMonth,
    cashflowNotesByMonth: state.cashflowNotesByMonth,
    customExpenseCategories: state.customExpenseCategories,
  };
  await db.put('meta', meta);
}

export const useStore = create<AppState>((set, get) => ({
  clients: [],
  receivables: [],
  payables: [],
  events: [],
  theme: 'dark',
  selectedMonth: currentMonthKey(),
  periodGrain: 'month',
  cashflowNotesByMonth: {},
  customExpenseCategories: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated || hydrationInFlight) return;
    hydrationInFlight = true;
    try {
      // One-time migration: clear any pre-existing seed/demo data
      const alreadyCleared = localStorage.getItem(SEED_CLEARED_FLAG);
      if (!alreadyCleared) {
        await Promise.all([
          db.clear('clients'),
          db.clear('receivables'),
          db.clear('payables'),
          db.clear('events'),
        ]);
        localStorage.setItem(SEED_CLEARED_FLAG, new Date().toISOString());
      }

      const [clients, receivables, payables, events, metaRows] = await Promise.all([
        db.all('clients'),
        db.all('receivables'),
        db.all('payables'),
        db.all('events'),
        db.all('meta'),
      ]);

      const meta = metaRows[0] ?? null;

      if (!meta) {
        await db.put('meta', defaultMeta());
      }

      const resolvedMeta = meta ?? defaultMeta();
      set({
        clients,
        receivables,
        payables,
        events,
        theme: resolvedMeta.theme,
        selectedMonth: resolvedMeta.selectedMonth,
        cashflowNotesByMonth: resolvedMeta.cashflowNotesByMonth ?? {},
        customExpenseCategories: resolvedMeta.customExpenseCategories ?? [],
        hydrated: true,
      });
      applyTheme(resolvedMeta.theme);
    } finally {
      hydrationInFlight = false;
    }
  },

  setTheme: (theme) => {
    set({ theme });
    applyTheme(theme);
    void persistMeta({ ...get(), theme });
  },

  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  setSelectedMonth: (selectedMonth) => {
    set({ selectedMonth });
    void persistMeta({ ...get(), selectedMonth });
  },

  setPeriodGrain: (periodGrain) => set({ periodGrain }),

  upsertClient: async (client) => {
    await db.put('clients', client);
    const exists = get().clients.some((c) => c.id === client.id);
    set({
      clients: exists
        ? get().clients.map((c) => (c.id === client.id ? client : c))
        : [...get().clients, client],
    });
  },

  removeClient: async (id) => {
    await db.delete('clients', id);
    set({ clients: get().clients.filter((c) => c.id !== id) });
  },

  upsertReceivable: async (r) => {
    await db.put('receivables', r);
    const exists = get().receivables.some((x) => x.id === r.id);
    set({
      receivables: exists
        ? get().receivables.map((x) => (x.id === r.id ? r : x))
        : [...get().receivables, r],
    });
  },

  removeReceivable: async (id) => {
    await db.delete('receivables', id);
    set({ receivables: get().receivables.filter((r) => r.id !== id) });
  },

  upsertPayable: async (p) => {
    await db.put('payables', p);
    const exists = get().payables.some((x) => x.id === p.id);
    set({
      payables: exists
        ? get().payables.map((x) => (x.id === p.id ? p : x))
        : [...get().payables, p],
    });
  },

  removePayable: async (id) => {
    await db.delete('payables', id);
    set({ payables: get().payables.filter((p) => p.id !== id) });
  },

  upsertEvent: async (e) => {
    await db.put('events', e);
    const exists = get().events.some((x) => x.id === e.id);
    set({
      events: exists
        ? get().events.map((x) => (x.id === e.id ? e : x))
        : [...get().events, e],
    });
  },

  removeEvent: async (id) => {
    await db.delete('events', id);
    set({ events: get().events.filter((e) => e.id !== id) });
  },

  setCashflowNote: async (month, note) => {
    const cashflowNotesByMonth = { ...get().cashflowNotesByMonth, [month]: note };
    set({ cashflowNotesByMonth });
    await persistMeta({ ...get(), cashflowNotesByMonth });
  },

  addCustomCategory: async (label) => {
    if (!label.trim()) return;
    const list = Array.from(new Set([...get().customExpenseCategories, label.trim()]));
    set({ customExpenseCategories: list });
    await persistMeta({ ...get(), customExpenseCategories: list });
  },

  resetSeed: async () => {
    await Promise.all([
      db.clear('clients'),
      db.clear('receivables'),
      db.clear('payables'),
      db.clear('events'),
      db.clear('meta'),
    ]);
    await db.put('meta', defaultMeta());
    set({
      clients: [],
      receivables: [],
      payables: [],
      events: [],
      cashflowNotesByMonth: {},
      customExpenseCategories: [],
      selectedMonth: currentMonthKey(),
    });
  },

  replaceAll: async ({ clients, receivables, payables, events, meta }) => {
    await Promise.all([
      db.clear('clients'),
      db.clear('receivables'),
      db.clear('payables'),
      db.clear('events'),
      db.clear('meta'),
    ]);
    await Promise.all([
      db.putMany('clients', clients),
      db.putMany('receivables', receivables),
      db.putMany('payables', payables),
      db.putMany('events', events),
      db.put('meta', meta ?? defaultMeta()),
    ]);
    const resolved = meta ?? defaultMeta();
    set({
      clients,
      receivables,
      payables,
      events,
      theme: resolved.theme,
      selectedMonth: resolved.selectedMonth,
      cashflowNotesByMonth: resolved.cashflowNotesByMonth ?? {},
      customExpenseCategories: resolved.customExpenseCategories ?? [],
      hydrated: true,
    });
    applyTheme(resolved.theme);
  },
}));

function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('light', theme === 'light');
  root.classList.toggle('dark', theme === 'dark');
}
