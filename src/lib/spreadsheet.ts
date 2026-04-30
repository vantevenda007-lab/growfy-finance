import * as XLSX from 'xlsx';
import { uid } from './utils';
import { currentMonthKey } from './format';
import type {
  Client,
  ContractType,
  ClientStatus,
  PipelineStage,
  Payable,
  ExpenseCategory,
  ExpenseStatus,
  ExpenseFlavor,
  PayMethod,
  Receivable,
  ReceiveType,
  ReceiveMethod,
  PaymentStatus,
} from '@/types';

export type ImportEntity = 'clients' | 'receivables' | 'payables';

export interface ParseResult {
  headers: string[];
  rows: Record<string, unknown>[];
}

/** Reads an .xlsx, .xls, .csv (or .tsv) file and returns headers + rows. */
export async function parseSpreadsheet(file: File): Promise<ParseResult> {
  const isText = /\.(csv|tsv|txt)$/i.test(file.name) || file.type.startsWith('text/');
  let workbook: XLSX.WorkBook;
  if (isText) {
    // For CSV/TSV: force UTF-8 + raw strings (don't auto-coerce dates — locale ambiguity).
    let text = await file.text();
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // strip BOM
    workbook = XLSX.read(text, { type: 'string', raw: true });
  } else {
    // For XLSX/XLS: arraybuffer with cellDates so true date cells become Date objects.
    const buffer = await file.arrayBuffer();
    workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  }
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) throw new Error('Planilha vazia.');
  const sheet = workbook.Sheets[firstSheetName];

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: isText, // keep raw strings for CSV; format Date objects for XLSX
    defval: '',
  });

  if (matrix.length === 0) {
    return { headers: [], rows: [] };
  }

  const rawHeaders = (matrix[0] as unknown[]).map((h) => String(h ?? '').trim());
  const headers = rawHeaders.filter(Boolean);

  const rows = matrix
    .slice(1)
    .map((row) => {
      const obj: Record<string, unknown> = {};
      rawHeaders.forEach((h, i) => {
        if (h) obj[h] = (row as unknown[])[i];
      });
      return obj;
    })
    .filter((row) => Object.values(row).some((v) => v !== '' && v !== null && v !== undefined));

  return { headers, rows };
}

/** Normalize a header for fuzzy matching: lowercase, no accents, no spaces, no punctuation. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/** Pick the first row value matching any of the candidate header names (fuzzy). */
function pick(row: Record<string, unknown>, candidates: string[]): string {
  const lookup = new Map(Object.keys(row).map((k) => [normalize(k), row[k]]));
  for (const cand of candidates) {
    const v = lookup.get(normalize(cand));
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      return String(v).trim();
    }
  }
  return '';
}

function parseNumber(value: string): number {
  if (!value) return 0;
  const cleaned = value
    .replace(/R\$/gi, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function parseDateISO(value: string): string {
  if (!value) return '';
  const trimmed = value.trim();
  // Already ISO yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  // Brazilian dd/mm/yyyy
  const br = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (br) {
    const [, d, m, y] = br;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // Fallback: Date.parse
  const t = Date.parse(trimmed);
  if (!Number.isNaN(t)) return new Date(t).toISOString().slice(0, 10);
  return '';
}

function monthKeyFrom(value: string): string {
  if (!value) return currentMonthKey();
  // YYYY-MM
  if (/^\d{4}-\d{2}$/.test(value)) return value;
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 7);
  const iso = parseDateISO(value);
  if (iso) return iso.slice(0, 7);
  // mm/yyyy
  const br = value.match(/^(\d{1,2})\/(\d{2,4})$/);
  if (br) {
    const [, m, y] = br;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, '0')}`;
  }
  return currentMonthKey();
}

function parseStatus<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  const norm = normalize(value);
  for (const a of allowed) {
    if (normalize(a) === norm) return a;
  }
  return fallback;
}

function parseClientStatus(value: string): ClientStatus {
  const n = normalize(value);
  if (['ativo', 'active'].includes(n)) return 'active';
  if (['pausado', 'paused', 'pause'].includes(n)) return 'paused';
  if (['churned', 'cancelado', 'churn'].includes(n)) return 'churned';
  return 'active';
}

function parseContractType(value: string): ContractType {
  const n = normalize(value);
  if (['fixo', 'fixed', 'mensalidade'].includes(n)) return 'fixed';
  if (['projeto', 'project', 'pontual'].includes(n)) return 'project';
  if (['variavel', 'recurringvariable', 'variable', 'recorrentevariavel'].includes(n)) {
    return 'recurring-variable';
  }
  return 'fixed';
}

function parsePipelineStage(value: string): PipelineStage {
  const n = normalize(value);
  if (['lead', 'novo'].includes(n)) return 'lead';
  if (['contato', 'contact'].includes(n)) return 'contact';
  if (['proposta', 'proposal'].includes(n)) return 'proposal';
  if (['negociacao', 'negotiation'].includes(n)) return 'negotiation';
  if (['ganho', 'won', 'fechado', 'cliente', 'clienteativo'].includes(n)) return 'won';
  if (['perdido', 'lost'].includes(n)) return 'lost';
  return 'lead';
}

function parseExpenseCategory(value: string): ExpenseCategory {
  const n = normalize(value);
  if (['funcionario', 'salario', 'employee'].includes(n)) return 'employee';
  if (['investimento', 'investment', 'ads'].includes(n)) return 'investment';
  if (['software', 'saas', 'sistema'].includes(n)) return 'software';
  if (['aluguel', 'rent'].includes(n)) return 'rent';
  if (['imposto', 'taxes', 'das'].includes(n)) return 'taxes';
  if (['marketing'].includes(n)) return 'marketing';
  if (['servico', 'services', 'freela'].includes(n)) return 'services';
  return 'other';
}

function parseReceiveType(value: string): ReceiveType {
  const n = normalize(value);
  if (['fixo', 'fixed', 'mensalidade'].includes(n)) return 'fixed';
  if (['variavel', 'variable'].includes(n)) return 'variable';
  if (['pontual', 'onetime', 'avulso'].includes(n)) return 'one-time';
  return 'fixed';
}

function parseReceiveMethod(value: string): ReceiveMethod {
  const n = normalize(value);
  if (['pix'].includes(n)) return 'pix';
  if (['ted', 'doc'].includes(n)) return 'ted';
  if (['boleto'].includes(n)) return 'boleto';
  if (['cartao', 'card', 'credito', 'debito'].includes(n)) return 'card';
  return 'other';
}

function parsePayMethod(value: string): PayMethod {
  const n = normalize(value);
  if (['pix'].includes(n)) return 'pix';
  if (['ted', 'doc'].includes(n)) return 'ted';
  if (['boleto'].includes(n)) return 'boleto';
  if (['cartao', 'card', 'credito'].includes(n)) return 'card';
  if (['debito', 'debit'].includes(n)) return 'debit';
  return 'other';
}

function parsePaymentStatus(value: string): PaymentStatus {
  const n = normalize(value);
  if (['pendente', 'pending', 'aguardando'].includes(n)) return 'pending';
  if (['pagopelocliente', 'paidbyclient', 'pago'].includes(n)) return 'paid-by-client';
  if (['confirmado', 'confirmed', 'recebido'].includes(n)) return 'confirmed';
  return 'pending';
}

function parseExpenseStatus(value: string): ExpenseStatus {
  const n = normalize(value);
  if (['pendente', 'pending'].includes(n)) return 'pending';
  if (['pago', 'paid'].includes(n)) return 'paid';
  if (['confirmado', 'confirmed'].includes(n)) return 'confirmed';
  return 'pending';
}

function parseExpenseFlavor(value: string): ExpenseFlavor {
  const n = normalize(value);
  if (['fixo', 'fixed', 'fixa'].includes(n)) return 'fixed';
  return 'variable';
}

const today = (): string => new Date().toISOString().slice(0, 10);
const nowISO = (): string => new Date().toISOString();

export interface RowError {
  rowIndex: number;
  message: string;
}

export interface MapResult<T> {
  ok: T[];
  errors: RowError[];
}

/** Map raw rows to Client objects. */
export function mapClients(rows: Record<string, unknown>[]): MapResult<Client> {
  const ok: Client[] = [];
  const errors: RowError[] = [];
  rows.forEach((row, idx) => {
    const company = pick(row, ['Empresa', 'Company', 'Cliente', 'Razão Social', 'Razao Social', 'Nome']);
    if (!company) {
      errors.push({ rowIndex: idx + 2, message: 'Sem "Empresa"/"Cliente".' });
      return;
    }
    const monthlyValue = parseNumber(
      pick(row, ['Valor Mensal', 'Valor', 'Mensalidade', 'MRR', 'Monthly Value']),
    );
    const start = parseDateISO(pick(row, ['Início', 'Inicio', 'Início Contrato', 'Contract Start'])) || today();
    const end =
      parseDateISO(pick(row, ['Fim', 'Renovação', 'Renovacao', 'Fim Contrato', 'Contract End'])) ||
      new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate())
        .toISOString()
        .slice(0, 10);

    ok.push({
      id: uid('cli'),
      company,
      contactName: pick(row, ['Contato', 'Nome Contato', 'Contact', 'Responsável', 'Responsavel']),
      phone: pick(row, ['Telefone', 'Phone', 'Celular', 'WhatsApp']),
      email: pick(row, ['Email', 'E-mail']),
      monthlyValue,
      contractType: parseContractType(pick(row, ['Tipo Contrato', 'Tipo', 'Contract Type'])),
      contractStart: start,
      contractEnd: end,
      status: parseClientStatus(pick(row, ['Status'])),
      pipelineStage: parsePipelineStage(pick(row, ['Etapa', 'Estágio', 'Estagio', 'Stage', 'Pipeline'])),
      source: pick(row, ['Origem', 'Source', 'Canal']) || undefined,
      estimatedValue: parseNumber(pick(row, ['Valor Estimado', 'Estimated Value'])) || undefined,
      priority: (() => {
        const p = normalize(pick(row, ['Prioridade', 'Priority']));
        if (p === 'alta' || p === 'high') return 'high';
        if (p === 'baixa' || p === 'low') return 'low';
        if (p === 'media' || p === 'medium') return 'medium';
        return undefined;
      })(),
      notes: pick(row, ['Observações', 'Observacoes', 'Notes', 'Notas']) || undefined,
      createdAt: nowISO(),
    });
  });
  return { ok, errors };
}

/** Map raw rows to Receivable objects. Requires existing clients to link by company name. */
export function mapReceivables(
  rows: Record<string, unknown>[],
  clients: Client[],
): MapResult<Receivable> {
  const ok: Receivable[] = [];
  const errors: RowError[] = [];
  const clientByName = new Map(clients.map((c) => [normalize(c.company), c]));

  rows.forEach((row, idx) => {
    const company = pick(row, ['Cliente', 'Empresa', 'Company']);
    const description = pick(row, ['Descrição', 'Descricao', 'Description', 'Lançamento', 'Lancamento']);
    const amount = parseNumber(pick(row, ['Valor', 'Amount']));
    const dueDate = parseDateISO(pick(row, ['Vencimento', 'Due Date', 'Data Vencimento']));

    if (!description && !company) {
      errors.push({ rowIndex: idx + 2, message: 'Sem "Cliente" e sem "Descrição".' });
      return;
    }
    if (amount <= 0) {
      errors.push({ rowIndex: idx + 2, message: 'Valor inválido (zero/negativo).' });
      return;
    }
    if (!dueDate) {
      errors.push({ rowIndex: idx + 2, message: 'Data de vencimento ausente/inválida.' });
      return;
    }

    const linked = company ? clientByName.get(normalize(company)) : undefined;
    if (company && !linked) {
      errors.push({
        rowIndex: idx + 2,
        message: `Cliente "${company}" não encontrado. Cadastre antes ou ajuste a planilha.`,
      });
      return;
    }

    const competence = monthKeyFrom(
      pick(row, ['Competência', 'Competencia', 'Competence', 'Mês', 'Mes']) || dueDate,
    );

    ok.push({
      id: uid('rec'),
      clientId: linked?.id ?? '',
      description: description || `Recebimento ${competence}`,
      type: parseReceiveType(pick(row, ['Tipo', 'Type'])),
      amount,
      competenceMonth: competence,
      dueDate,
      receivedDate: parseDateISO(pick(row, ['Recebimento', 'Received', 'Data Recebimento'])) || undefined,
      status: parsePaymentStatus(pick(row, ['Status'])),
      method: parseReceiveMethod(pick(row, ['Método', 'Metodo', 'Method', 'Forma'])),
      notes: pick(row, ['Observações', 'Observacoes', 'Notes']) || undefined,
      createdAt: nowISO(),
    });
  });

  return { ok, errors };
}

/** Map raw rows to Payable objects. */
export function mapPayables(rows: Record<string, unknown>[]): MapResult<Payable> {
  const ok: Payable[] = [];
  const errors: RowError[] = [];

  rows.forEach((row, idx) => {
    const description = pick(row, ['Descrição', 'Descricao', 'Description', 'Despesa']);
    const amount = parseNumber(pick(row, ['Valor', 'Amount']));
    const dueDate = parseDateISO(pick(row, ['Vencimento', 'Due Date', 'Data Vencimento']));

    if (!description) {
      errors.push({ rowIndex: idx + 2, message: 'Sem "Descrição"/"Despesa".' });
      return;
    }
    if (amount <= 0) {
      errors.push({ rowIndex: idx + 2, message: 'Valor inválido (zero/negativo).' });
      return;
    }
    if (!dueDate) {
      errors.push({ rowIndex: idx + 2, message: 'Data de vencimento ausente/inválida.' });
      return;
    }

    const competence = monthKeyFrom(
      pick(row, ['Competência', 'Competencia', 'Mês', 'Mes']) || dueDate,
    );

    const recurring = (() => {
      const v = normalize(pick(row, ['Recorrente', 'Recurring']));
      return ['sim', 'yes', 'true', '1', 'recorrente'].includes(v);
    })();

    ok.push({
      id: uid('pay'),
      description,
      category: parseExpenseCategory(pick(row, ['Categoria', 'Category'])),
      flavor: parseExpenseFlavor(pick(row, ['Tipo', 'Type', 'Natureza'])),
      amount,
      competenceMonth: competence,
      dueDate,
      paidDate: parseDateISO(pick(row, ['Pago em', 'Paid', 'Data Pagamento'])) || undefined,
      status: parseExpenseStatus(pick(row, ['Status'])),
      vendor: pick(row, ['Fornecedor', 'Vendor', 'Beneficiário', 'Beneficiario']),
      method: parsePayMethod(pick(row, ['Método', 'Metodo', 'Method', 'Forma'])),
      recurring,
      notes: pick(row, ['Observações', 'Observacoes', 'Notes']) || undefined,
      createdAt: nowISO(),
    });
  });

  return { ok, errors };
}

/** Try to detect entity from headers. */
export function detectEntity(headers: string[]): ImportEntity | null {
  const norm = headers.map(normalize);
  const has = (...keys: string[]) => keys.some((k) => norm.includes(normalize(k)));

  // Receivables: has "Cliente" + "Vencimento"
  if (has('cliente', 'empresa') && has('vencimento') && !has('fornecedor', 'beneficiario')) {
    return 'receivables';
  }
  // Payables: has "Fornecedor" or "Despesa" or "Categoria"
  if (has('fornecedor', 'beneficiario', 'despesa') || (has('categoria') && has('vencimento'))) {
    return 'payables';
  }
  // Clients: has Empresa/Cliente without Vencimento
  if (has('empresa', 'cliente') && !has('vencimento')) {
    return 'clients';
  }
  return null;
}

/** Suppress used import linter — avoid bundler stripping XLSX side effects. */
export const __XLSX = XLSX;
