import { openDB, type IDBPDatabase } from 'idb';
import type { AppMeta, CalendarEvent, Client, Payable, Receivable } from '@/types';

const DB_NAME = 'agencyfinance';
const DB_VERSION = 2;

interface AFSchema {
  clients: Client;
  receivables: Receivable;
  payables: Payable;
  meta: AppMeta;
  events: CalendarEvent;
}

let dbPromise: Promise<IDBPDatabase<AFSchema>> | null = null;

function getDb(): Promise<IDBPDatabase<AFSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<AFSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('clients')) {
          db.createObjectStore('clients', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('receivables')) {
          db.createObjectStore('receivables', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('payables')) {
          db.createObjectStore('payables', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('events')) {
          db.createObjectStore('events', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export const db = {
  async all<K extends keyof AFSchema>(store: K): Promise<AFSchema[K][]> {
    const conn = await getDb();
    return conn.getAll(store) as Promise<AFSchema[K][]>;
  },
  async put<K extends keyof AFSchema>(store: K, value: AFSchema[K]): Promise<void> {
    const conn = await getDb();
    await conn.put(store, value);
  },
  async putMany<K extends keyof AFSchema>(store: K, values: AFSchema[K][]): Promise<void> {
    const conn = await getDb();
    const tx = conn.transaction(store, 'readwrite');
    await Promise.all(values.map((v) => tx.store.put(v)));
    await tx.done;
  },
  async delete<K extends keyof AFSchema>(store: K, key: string): Promise<void> {
    const conn = await getDb();
    await conn.delete(store, key);
  },
  async clear<K extends keyof AFSchema>(store: K): Promise<void> {
    const conn = await getDb();
    await conn.clear(store);
  },
  async get<K extends keyof AFSchema>(store: K, key: string): Promise<AFSchema[K] | undefined> {
    const conn = await getDb();
    return conn.get(store, key) as Promise<AFSchema[K] | undefined>;
  },
};

export interface BackupBundle {
  schemaVersion: 1 | 2;
  exportedAt: string;
  clients: Client[];
  receivables: Receivable[];
  payables: Payable[];
  events?: CalendarEvent[];
  meta: AppMeta | null;
}

export async function exportBackup(): Promise<BackupBundle> {
  const [clients, receivables, payables, events, metaRows] = await Promise.all([
    db.all('clients'),
    db.all('receivables'),
    db.all('payables'),
    db.all('events'),
    db.all('meta'),
  ]);
  return {
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    clients,
    receivables,
    payables,
    events,
    meta: metaRows[0] ?? null,
  };
}

export async function importBackup(bundle: BackupBundle): Promise<void> {
  if (bundle.schemaVersion !== 1 && bundle.schemaVersion !== 2) {
    throw new Error(`Versão de schema não suportada: ${bundle.schemaVersion}`);
  }
  await Promise.all([
    db.clear('clients'),
    db.clear('receivables'),
    db.clear('payables'),
    db.clear('events'),
    db.clear('meta'),
  ]);
  await Promise.all([
    db.putMany('clients', bundle.clients),
    db.putMany('receivables', bundle.receivables),
    db.putMany('payables', bundle.payables),
    bundle.events ? db.putMany('events', bundle.events) : Promise.resolve(),
    bundle.meta ? db.put('meta', bundle.meta) : Promise.resolve(),
  ]);
}
