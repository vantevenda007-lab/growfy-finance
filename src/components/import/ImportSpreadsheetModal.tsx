import { useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useStore } from '@/stores/useStore';
import { toast } from '@/components/shell/Toaster';
import {
  detectEntity,
  mapClients,
  mapPayables,
  mapReceivables,
  parseSpreadsheet,
  type ImportEntity,
  type RowError,
} from '@/lib/spreadsheet';
import { formatBRL } from '@/lib/format';

interface ImportSpreadsheetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-select target entity (used when invoked from a specific page). */
  defaultEntity?: ImportEntity;
}

interface PreviewState {
  fileName: string;
  entity: ImportEntity;
  headers: string[];
  rows: Record<string, unknown>[];
  okCount: number;
  errors: RowError[];
}

const ENTITY_LABEL: Record<ImportEntity, string> = {
  clients: 'Clientes',
  receivables: 'Contas a Receber',
  payables: 'Contas a Pagar',
};

export function ImportSpreadsheetModal({
  open,
  onOpenChange,
  defaultEntity,
}: ImportSpreadsheetModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clients = useStore((s) => s.clients);
  const upsertClient = useStore((s) => s.upsertClient);
  const upsertReceivable = useStore((s) => s.upsertReceivable);
  const upsertPayable = useStore((s) => s.upsertPayable);

  const [entity, setEntity] = useState<ImportEntity>(defaultEntity ?? 'clients');
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [importing, setImporting] = useState(false);

  function reset(): void {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function onFile(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { headers, rows } = await parseSpreadsheet(file);

      if (rows.length === 0) {
        toast('Planilha vazia', {
          description: 'Não encontramos linhas com dados.',
          tone: 'warning',
        });
        return;
      }

      const detected = detectEntity(headers);
      const targetEntity = defaultEntity ?? detected ?? entity;
      setEntity(targetEntity);

      const result = computeMap(targetEntity, rows, clients);

      setPreview({
        fileName: file.name,
        entity: targetEntity,
        headers,
        rows,
        okCount: result.ok,
        errors: result.errors,
      });
    } catch (err) {
      toast('Falha ao ler planilha', {
        description: (err as Error).message,
        tone: 'error',
      });
    }
  }

  function changeEntity(next: ImportEntity): void {
    setEntity(next);
    if (preview) {
      const result = computeMap(next, preview.rows, clients);
      setPreview({ ...preview, entity: next, okCount: result.ok, errors: result.errors });
    }
  }

  async function confirmImport(): Promise<void> {
    if (!preview) return;
    setImporting(true);
    try {
      if (preview.entity === 'clients') {
        const { ok } = mapClients(preview.rows);
        for (const c of ok) await upsertClient(c);
        toast(`${ok.length} cliente${ok.length === 1 ? '' : 's'} importado${ok.length === 1 ? '' : 's'}`, {
          description: preview.fileName,
        });
      } else if (preview.entity === 'receivables') {
        const { ok } = mapReceivables(preview.rows, clients);
        for (const r of ok) await upsertReceivable(r);
        toast(`${ok.length} lançamento${ok.length === 1 ? '' : 's'} importado${ok.length === 1 ? '' : 's'}`, {
          description: preview.fileName,
        });
      } else if (preview.entity === 'payables') {
        const { ok } = mapPayables(preview.rows);
        for (const p of ok) await upsertPayable(p);
        toast(`${ok.length} despesa${ok.length === 1 ? '' : 's'} importada${ok.length === 1 ? '' : 's'}`, {
          description: preview.fileName,
        });
      }
      reset();
      onOpenChange(false);
    } catch (err) {
      toast('Erro ao importar', { description: (err as Error).message, tone: 'error' });
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar planilha</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Entity selector — only shown when not locked to a specific page */}
          {!defaultEntity && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                Tipo de dado
              </p>
              <div className="inline-flex rounded-md border border-border bg-card p-0.5">
                {(['clients', 'receivables', 'payables'] as ImportEntity[]).map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => changeEntity(e)}
                    className={`px-3 h-8 text-xs rounded transition-colors ${
                      entity === e
                        ? 'bg-secondary text-foreground border border-border'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {ENTITY_LABEL[e]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Drop zone */}
          {!preview && (
            <div className="rounded-lg border border-dashed border-border bg-card/40 p-6 text-center">
              <FileSpreadsheet className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Selecione um arquivo .xlsx, .xls ou .csv</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Os cabeçalhos são reconhecidos automaticamente em PT-BR ou EN.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-3.5 w-3.5" /> Escolher arquivo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.tsv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                className="hidden"
                onChange={onFile}
              />
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border bg-card/60 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Arquivo</p>
                  <p className="text-sm font-medium truncate">{preview.fileName}</p>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Trocar arquivo
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <SummaryStat label="Linhas" value={String(preview.rows.length)} />
                <SummaryStat
                  label="Válidas"
                  value={String(preview.okCount)}
                  tone={preview.okCount > 0 ? 'success' : undefined}
                />
                <SummaryStat
                  label="Com erro"
                  value={String(preview.errors.length)}
                  tone={preview.errors.length > 0 ? 'warning' : undefined}
                />
              </div>

              {/* Header preview */}
              <div className="rounded-lg border border-border bg-card/40 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                  Colunas detectadas
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {preview.headers.map((h) => (
                    <span
                      key={h}
                      className="px-2 py-0.5 rounded border border-border bg-secondary/40 text-[11px]"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sample rows */}
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="px-3 py-2 bg-secondary/40 text-[10px] uppercase tracking-[0.18em] text-muted-foreground border-b border-border">
                  Prévia das primeiras linhas
                </div>
                <div className="overflow-x-auto max-h-[180px]">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="text-muted-foreground">
                        {preview.headers.slice(0, 6).map((h) => (
                          <th key={h} className="text-left py-2 px-3 font-medium border-b border-border">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.slice(0, 4).map((row, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          {preview.headers.slice(0, 6).map((h) => {
                            const value = row[h];
                            const display = formatPreviewValue(h, value);
                            return (
                              <td key={h} className="py-2 px-3 truncate max-w-[180px]">
                                {display}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Errors */}
              {preview.errors.length > 0 && (
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                    <p className="text-xs font-medium text-warning">
                      {preview.errors.length} linha{preview.errors.length === 1 ? '' : 's'} com problema
                    </p>
                  </div>
                  <ul className="text-[11px] text-muted-foreground space-y-0.5 max-h-[100px] overflow-y-auto pr-2">
                    {preview.errors.slice(0, 8).map((e, i) => (
                      <li key={i}>
                        Linha {e.rowIndex}: {e.message}
                      </li>
                    ))}
                    {preview.errors.length > 8 && (
                      <li className="text-muted-foreground/60">… e mais {preview.errors.length - 8}.</li>
                    )}
                  </ul>
                </div>
              )}

              {preview.okCount > 0 && (
                <div className="flex items-center gap-2 text-xs text-accent">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Pronto para importar {preview.okCount} {ENTITY_LABEL[preview.entity].toLowerCase()}.
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="accent"
                  onClick={confirmImport}
                  disabled={importing || preview.okCount === 0}
                >
                  {importing ? 'Importando…' : `Importar ${preview.okCount}`}
                </Button>
              </div>
            </div>
          )}

          {/* Help: expected columns */}
          {!preview && (
            <details className="rounded-lg border border-border bg-card/30 p-3">
              <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                Colunas esperadas para {ENTITY_LABEL[entity]}
              </summary>
              <div className="mt-3 text-[11px] text-muted-foreground space-y-1.5 leading-relaxed">
                {entity === 'clients' && (
                  <p>
                    <strong className="text-foreground">Obrigatórias:</strong> Empresa.{' '}
                    <strong className="text-foreground">Opcionais:</strong> Contato, Telefone, Email,
                    Valor Mensal, Tipo Contrato (fixo/projeto/variável), Início, Renovação, Status,
                    Etapa (lead/contato/proposta/negociação/ganho), Origem, Prioridade, Observações.
                  </p>
                )}
                {entity === 'receivables' && (
                  <p>
                    <strong className="text-foreground">Obrigatórias:</strong> Cliente, Descrição,
                    Valor, Vencimento.{' '}
                    <strong className="text-foreground">Opcionais:</strong> Tipo (fixo/variável/pontual),
                    Competência, Recebimento, Status, Método (pix/ted/boleto/cartão).
                  </p>
                )}
                {entity === 'payables' && (
                  <p>
                    <strong className="text-foreground">Obrigatórias:</strong> Descrição, Valor,
                    Vencimento.{' '}
                    <strong className="text-foreground">Opcionais:</strong> Categoria, Tipo (fixa/variável),
                    Fornecedor, Status, Método, Pago em, Recorrente.
                  </p>
                )}
              </div>
            </details>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function computeMap(
  entity: ImportEntity,
  rows: Record<string, unknown>[],
  clients: ReturnType<typeof useStore.getState>['clients'],
): { ok: number; errors: RowError[] } {
  if (entity === 'clients') {
    const r = mapClients(rows);
    return { ok: r.ok.length, errors: r.errors };
  }
  if (entity === 'receivables') {
    const r = mapReceivables(rows, clients);
    return { ok: r.ok.length, errors: r.errors };
  }
  const r = mapPayables(rows);
  return { ok: r.ok.length, errors: r.errors };
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'success' | 'warning';
}) {
  const accent =
    tone === 'success'
      ? 'border-accent/40 text-accent'
      : tone === 'warning'
      ? 'border-warning/40 text-warning'
      : 'border-border';
  return (
    <div className={`rounded-lg border ${accent} bg-card/40 p-3`}>
      <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="text-lg font-display tabular tracking-tight mt-0.5">{value}</p>
    </div>
  );
}

function formatPreviewValue(header: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  const headerLow = header.toLowerCase();
  if (headerLow.includes('valor') || headerLow.includes('mrr') || headerLow.includes('amount')) {
    if (typeof value === 'number') return formatBRL(value);
    const cleaned = String(value)
      .replace(/R\$/gi, '')
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    const n = parseFloat(cleaned);
    if (Number.isFinite(n)) return formatBRL(n);
  }
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}
