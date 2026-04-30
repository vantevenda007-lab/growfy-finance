import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Download, Trash2, Pencil, RotateCw, Upload } from 'lucide-react';
import { ImportSpreadsheetModal } from '@/components/import/ImportSpreadsheetModal';
import { useStore } from '@/stores/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PayStatusBadge } from '@/components/shell/StatusBadge';
import { PayableForm } from '@/components/payables/PayableForm';
import { toast } from '@/components/shell/Toaster';
import { downloadCSV } from '@/lib/csv';
import { formatBRL, formatDate, formatMonthLabel } from '@/lib/format';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/colors';
import { expenseCategoryBreakdown } from '@/lib/selectors';
import type { ExpenseCategory, ExpenseFlavor, ExpenseStatus, Payable } from '@/types';

export function Payables() {
  const { selectedMonth, payables, upsertPayable, removePayable } = useStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ExpenseStatus>('all');
  const [flavorFilter, setFlavorFilter] = useState<'all' | ExpenseFlavor>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ExpenseCategory>('all');
  const [editing, setEditing] = useState<Payable | null>(null);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);

  const monthRows = useMemo(() => payables.filter((p) => p.competenceMonth === selectedMonth), [payables, selectedMonth]);

  const totals = useMemo(() => {
    const total = monthRows.reduce((acc, p) => acc + p.amount, 0);
    const fixed = monthRows.filter((p) => p.flavor === 'fixed').reduce((a, p) => a + p.amount, 0);
    const variable = total - fixed;
    const paid = monthRows.filter((p) => p.status === 'confirmed').reduce((a, p) => a + p.amount, 0);
    const open = total - paid;
    return { total, fixed, variable, paid, open };
  }, [monthRows]);

  const breakdown = useMemo(() => expenseCategoryBreakdown(selectedMonth, payables), [selectedMonth, payables]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    return monthRows
      .filter((p) => statusFilter === 'all' || p.status === statusFilter)
      .filter((p) => flavorFilter === 'all' || p.flavor === flavorFilter)
      .filter((p) => categoryFilter === 'all' || p.category === categoryFilter)
      .filter((p) => {
        if (!s) return true;
        return (
          p.description.toLowerCase().includes(s) ||
          p.vendor.toLowerCase().includes(s)
        );
      })
      .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
  }, [monthRows, statusFilter, flavorFilter, categoryFilter, search]);

  function handleDelete(p: Payable): void {
    if (window.confirm('Excluir despesa?')) void removePayable(p.id);
  }

  function quickAdvance(p: Payable): void {
    const next: ExpenseStatus = p.status === 'pending' ? 'paid' : p.status === 'paid' ? 'confirmed' : 'pending';
    const updated: Payable = {
      ...p,
      status: next,
      paidDate: next === 'confirmed' ? p.paidDate ?? new Date().toISOString().slice(0, 10) : p.paidDate,
    };
    void upsertPayable(updated);
  }

  function exportCSV(): void {
    const rows = filtered.map((p) => ({
      Descrição: p.description,
      Categoria: CATEGORY_LABELS[p.category] ?? p.customCategory ?? p.category,
      Tipo: p.flavor,
      Valor: p.amount.toFixed(2),
      Competência: p.competenceMonth,
      Vencimento: p.dueDate,
      Pagamento: p.paidDate ?? '',
      Status: p.status,
      Fornecedor: p.vendor,
      Método: p.method,
    }));
    downloadCSV(`a-pagar-${selectedMonth}.csv`, rows);
  }

  const maxAmount = Math.max(...breakdown.map((b) => b.amount), 1);

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="t-eyebrow mb-1.5">Saídas</p>
          <h1 className="t-page-title">Contas a Pagar</h1>
          <p className="t-lead mt-1.5"><span className="capitalize">{formatMonthLabel(selectedMonth)}</span> · {filtered.length} despesa(s)</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setImporting(true)}>
            <Upload className="h-4 w-4" /> Importar planilha
          </Button>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="accent" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Nova despesa
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <SmallStat label="Total despesas" value={formatBRL(totals.total)} />
        <SmallStat label="Fixas" value={formatBRL(totals.fixed)} />
        <SmallStat label="Variáveis" value={formatBRL(totals.variable)} />
        <SmallStat label="Já pago" value={formatBRL(totals.paid)} accent="success" />
        <SmallStat label="A pagar" value={formatBRL(totals.open)} accent="warning" />
      </section>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Distribuição por categoria</span>
            <span className="text-xs text-muted-foreground tabular">{breakdown.length} categoria{breakdown.length === 1 ? '' : 's'}</span>
          </div>
          <div className="space-y-2">
            {breakdown.length === 0 && <p className="text-sm text-muted-foreground">Sem dados.</p>}
            {breakdown.map((b, idx) => (
              <motion.div
                key={b.category}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="flex items-center gap-3"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ background: CATEGORY_COLORS[b.category] ?? '#94a3b8' }}
                />
                <span className="text-sm w-32 truncate">{CATEGORY_LABELS[b.category] ?? b.category}</span>
                <div className="flex-1 h-2 rounded-full bg-secondary/40 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(b.amount / maxAmount) * 100}%` }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: idx * 0.04 }}
                    className="h-full rounded-full"
                    style={{ background: CATEGORY_COLORS[b.category] ?? '#94a3b8' }}
                  />
                </div>
                <span className="tabular text-sm w-28 text-right font-medium">{formatBRL(b.amount)}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="grid gap-3 grid-cols-1 md:grid-cols-4 p-5 border-b border-border">
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | ExpenseStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={flavorFilter} onValueChange={(v) => setFlavorFilter(v as 'all' | ExpenseFlavor)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="fixed">Fixo</SelectItem>
                <SelectItem value="variable">Variável</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as 'all' | ExpenseCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {(Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map((c) => (
                  <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  <th className="text-left py-3 px-5 font-medium">Descrição</th>
                  <th className="text-left py-3 px-5 font-medium hidden md:table-cell">Fornecedor</th>
                  <th className="text-left py-3 px-5 font-medium">Categoria</th>
                  <th className="text-left py-3 px-5 font-medium hidden lg:table-cell">Vencimento</th>
                  <th className="text-right py-3 px-5 font-medium">Valor</th>
                  <th className="text-left py-3 px-5 font-medium">Status</th>
                  <th className="py-3 px-5" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Nenhuma despesa.</td></tr>
                )}
                {filtered.map((p, idx) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.015 }}
                    className="border-t border-border hover:bg-secondary/20"
                  >
                    <td className="py-3 px-5">
                      <p className="font-medium">{p.description}</p>
                      {p.recurring && (
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Recorrente</span>
                      )}
                    </td>
                    <td className="py-3 px-5 hidden md:table-cell text-muted-foreground">{p.vendor || '—'}</td>
                    <td className="py-3 px-5">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: CATEGORY_COLORS[p.category] ?? '#94a3b8' }}
                        />
                        <span className="text-muted-foreground">
                          {CATEGORY_LABELS[p.category] ?? p.customCategory ?? p.category}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-5 hidden lg:table-cell text-muted-foreground tabular">{formatDate(p.dueDate)}</td>
                    <td className="py-3 px-5 text-right tabular font-medium">{formatBRL(p.amount)}</td>
                    <td className="py-3 px-5">
                      <button onClick={() => quickAdvance(p)}>
                        <PayStatusBadge status={p.status} />
                      </button>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => quickAdvance(p)} title="Avançar status">
                          <RotateCw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setEditing(p)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(p)}
                          title="Excluir"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={creating || Boolean(editing)} onOpenChange={(o) => {
        if (!o) {
          setCreating(false);
          setEditing(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar despesa' : 'Nova despesa'}</DialogTitle>
          </DialogHeader>
          <PayableForm
            initial={editing ?? undefined}
            onSubmit={async (p) => {
              const isNew = !editing;
              await upsertPayable(p);
              setCreating(false);
              setEditing(null);
              toast(isNew ? 'Despesa criada' : 'Despesa atualizada', { description: p.description });
            }}
            onCancel={() => {
              setCreating(false);
              setEditing(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <ImportSpreadsheetModal
        open={importing}
        onOpenChange={setImporting}
        defaultEntity="payables"
      />
    </div>
  );
}

function SmallStat({ label, value, accent }: { label: string; value: string; accent?: 'success' | 'warning' | 'danger' }) {
  const accentClass =
    accent === 'success' ? 'text-accent border-accent/30' :
    accent === 'warning' ? 'text-warning border-warning/30' :
    accent === 'danger' ? 'text-destructive border-destructive/30' :
    '';
  return (
    <Card className={accentClass}>
      <CardContent className="p-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="font-display text-xl tabular tracking-tight mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}
