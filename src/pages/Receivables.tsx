import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Download, Trash2, Pencil, CalendarPlus, RotateCw, Upload } from 'lucide-react';
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
import { ReceiveStatusBadge } from '@/components/shell/StatusBadge';
import { ReceivableForm } from '@/components/receivables/ReceivableForm';
import { toast } from '@/components/shell/Toaster';
import { downloadCSV } from '@/lib/csv';
import { formatBRL, formatDate, daysUntil, formatMonthLabel } from '@/lib/format';
import { uid } from '@/lib/utils';
import type { PaymentStatus, ReceiveType, Receivable } from '@/types';

export function Receivables() {
  const { selectedMonth, clients, receivables, upsertReceivable, removeReceivable } = useStore();

  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | ReceiveType>('all');
  const [clientFilter, setClientFilter] = useState<'all' | string>('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Receivable | null>(null);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);

  const monthRows = useMemo(() => receivables.filter((r) => r.competenceMonth === selectedMonth), [receivables, selectedMonth]);

  const totals = useMemo(() => {
    const total = monthRows.reduce((acc, r) => acc + r.amount, 0);
    const confirmed = monthRows.filter((r) => r.status === 'confirmed').reduce((a, r) => a + r.amount, 0);
    const pendingClient = monthRows.filter((r) => r.status === 'paid-by-client').reduce((a, r) => a + r.amount, 0);
    const overdue = monthRows
      .filter((r) => r.status !== 'confirmed' && daysUntil(r.dueDate) < 0)
      .reduce((a, r) => a + r.amount, 0);
    return { total, confirmed, pendingClient, overdue };
  }, [monthRows]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    return monthRows
      .filter((r) => statusFilter === 'all' || r.status === statusFilter)
      .filter((r) => typeFilter === 'all' || r.type === typeFilter)
      .filter((r) => clientFilter === 'all' || r.clientId === clientFilter)
      .filter((r) => {
        if (!s) return true;
        const client = clients.find((c) => c.id === r.clientId);
        return r.description.toLowerCase().includes(s) || client?.company.toLowerCase().includes(s);
      })
      .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
  }, [monthRows, statusFilter, typeFilter, clientFilter, search, clients]);

  function handleDelete(r: Receivable): void {
    if (window.confirm('Excluir lançamento?')) void removeReceivable(r.id);
  }

  function quickAdvance(r: Receivable): void {
    const next: PaymentStatus = r.status === 'pending' ? 'paid-by-client' : r.status === 'paid-by-client' ? 'confirmed' : 'pending';
    const updated: Receivable = {
      ...r,
      status: next,
      receivedDate: next === 'confirmed' ? r.receivedDate ?? new Date().toISOString().slice(0, 10) : r.receivedDate,
    };
    void upsertReceivable(updated);
  }

  async function generateRecurringForActiveContracts(): Promise<void> {
    const target = selectedMonth;
    let count = 0;
    for (const client of clients) {
      if (client.status !== 'active') continue;
      if (client.contractType === 'project') continue;
      const exists = receivables.some((r) => r.clientId === client.id && r.competenceMonth === target);
      if (exists) continue;
      const dueDate = `${target}-${String(5 + (clients.indexOf(client) % 20)).padStart(2, '0')}`;
      const r: Receivable = {
        id: uid('rec'),
        clientId: client.id,
        description: `Mensalidade ${formatMonthLabel(target)}`,
        type: client.contractType === 'recurring-variable' ? 'variable' : 'fixed',
        amount: client.monthlyValue,
        competenceMonth: target,
        dueDate,
        status: 'pending',
        method: 'pix',
        createdAt: new Date().toISOString(),
      };
      await upsertReceivable(r);
      count += 1;
    }
    if (count > 0) {
      toast(`${count} lançamento${count === 1 ? '' : 's'} gerado${count === 1 ? '' : 's'}`, {
        description: `Recorrências de ${formatMonthLabel(target)}`,
      });
    } else {
      toast('Recorrências em dia', {
        description: 'Todos os clientes já têm lançamentos neste mês.',
        tone: 'info',
      });
    }
  }

  function exportCSV(): void {
    const rows = filtered.map((r) => {
      const client = clients.find((c) => c.id === r.clientId);
      return {
        Cliente: client?.company ?? '',
        Descrição: r.description,
        Tipo: r.type,
        Valor: r.amount.toFixed(2),
        Competência: r.competenceMonth,
        Vencimento: r.dueDate,
        Recebimento: r.receivedDate ?? '',
        Status: r.status,
        Método: r.method,
      };
    });
    downloadCSV(`a-receber-${selectedMonth}.csv`, rows);
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-display-md tracking-tight">Contas a Receber</h1>
          <p className="text-muted-foreground"><span className="capitalize">{formatMonthLabel(selectedMonth)}</span> · {filtered.length} lançamento(s)</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={generateRecurringForActiveContracts}>
            <CalendarPlus className="h-4 w-4" /> Gerar recorrências
          </Button>
          <Button variant="outline" onClick={() => setImporting(true)}>
            <Upload className="h-4 w-4" /> Importar planilha
          </Button>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="accent" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Novo lançamento
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SmallStat label="Total a receber" value={formatBRL(totals.total)} />
        <SmallStat label="Confirmado" value={formatBRL(totals.confirmed)} accent="success" />
        <SmallStat label="Aguardando confirmação" value={formatBRL(totals.pendingClient)} accent="warning" />
        <SmallStat label="Em atraso" value={formatBRL(totals.overdue)} accent="danger" />
      </section>

      <Card>
        <CardContent className="p-0">
          <div className="grid gap-3 grid-cols-1 md:grid-cols-4 p-5 border-b border-border">
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | PaymentStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid-by-client">Pago pelo cliente</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as 'all' | ReceiveType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="fixed">Fixo</SelectItem>
                <SelectItem value="variable">Variável</SelectItem>
                <SelectItem value="one-time">Pontual</SelectItem>
              </SelectContent>
            </Select>
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.company}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  <th className="text-left py-3 px-5 font-medium">Cliente</th>
                  <th className="text-left py-3 px-5 font-medium">Descrição</th>
                  <th className="text-left py-3 px-5 font-medium hidden md:table-cell">Vencimento</th>
                  <th className="text-right py-3 px-5 font-medium">Valor</th>
                  <th className="text-left py-3 px-5 font-medium">Status</th>
                  <th className="py-3 px-5" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Nenhum lançamento.</td></tr>
                )}
                {filtered.map((r, idx) => {
                  const client = clients.find((c) => c.id === r.clientId);
                  const days = daysUntil(r.dueDate);
                  const overdue = r.status !== 'confirmed' && days < 0;
                  return (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.015 }}
                      className="border-t border-border hover:bg-secondary/20"
                    >
                      <td className="py-3 px-5">
                        <p className="font-medium">{client?.company ?? '—'}</p>
                      </td>
                      <td className="py-3 px-5 text-muted-foreground">{r.description}</td>
                      <td className="py-3 px-5 hidden md:table-cell">
                        <span className={overdue ? 'text-destructive font-medium' : ''}>{formatDate(r.dueDate)}</span>
                      </td>
                      <td className="py-3 px-5 text-right tabular font-medium">{formatBRL(r.amount)}</td>
                      <td className="py-3 px-5">
                        <button onClick={() => quickAdvance(r)} className="hover:opacity-80 transition-opacity">
                          <ReceiveStatusBadge status={r.status} />
                        </button>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => quickAdvance(r)} title="Avançar status">
                            <RotateCw className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditing(r)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(r)}
                            title="Excluir"
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
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
            <DialogTitle>{editing ? 'Editar lançamento' : 'Novo lançamento'}</DialogTitle>
          </DialogHeader>
          <ReceivableForm
            initial={editing ?? undefined}
            onSubmit={async (r) => {
              const isNew = !editing;
              await upsertReceivable(r);
              setCreating(false);
              setEditing(null);
              toast(isNew ? 'Lançamento criado' : 'Lançamento atualizado', { description: r.description });
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
        defaultEntity="receivables"
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
