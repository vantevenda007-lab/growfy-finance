import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2, Pencil, AlertCircle, KanbanSquare, Table2, Users, Upload } from 'lucide-react';
import { ImportSpreadsheetModal } from '@/components/import/ImportSpreadsheetModal';
import { useStore } from '@/stores/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { ClientStatusBadge } from '@/components/shell/StatusBadge';
import { ClientForm } from '@/components/crm/ClientForm';
import { ClientDetailDrawer } from '@/components/crm/ClientDetailDrawer';
import { LeadsKanban } from '@/components/crm/LeadsKanban';
import { toast } from '@/components/shell/Toaster';
import { formatBRL, daysUntil, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Client, ClientStatus, PipelineStage } from '@/types';

type SortKey = 'company' | 'monthlyValue' | 'contractEnd' | 'status';
type ViewMode = 'pipeline' | 'table';

export function CRM() {
  const clients = useStore((s) => s.clients);
  const receivables = useStore((s) => s.receivables);
  const upsertClient = useStore((s) => s.upsertClient);
  const removeClient = useStore((s) => s.removeClient);

  const [view, setView] = useState<ViewMode>('pipeline');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ClientStatus>('all');
  const [sortKey, setSortKey] = useState<SortKey>('company');
  const [sortAsc, setSortAsc] = useState(true);
  const [editing, setEditing] = useState<Client | null>(null);
  const [creating, setCreating] = useState(false);
  const [createStage, setCreateStage] = useState<PipelineStage | null>(null);
  const [openDetailId, setOpenDetailId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const stats = useMemo(() => {
    const active = clients.filter((c) => c.status === 'active');
    const mrr = active
      .filter((c) => c.contractType !== 'project')
      .reduce((acc, c) => acc + c.monthlyValue, 0);
    const ticket = active.length > 0 ? mrr / active.length : 0;
    return { activeCount: active.length, mrr, ticket };
  }, [clients]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    return clients
      .filter((c) => (statusFilter === 'all' ? true : c.status === statusFilter))
      .filter((c) => {
        if (!s) return true;
        return (
          c.company.toLowerCase().includes(s) ||
          c.contactName.toLowerCase().includes(s) ||
          c.email.toLowerCase().includes(s) ||
          c.phone.includes(s)
        );
      })
      .sort((a, b) => {
        const dir = sortAsc ? 1 : -1;
        if (sortKey === 'monthlyValue') return (a.monthlyValue - b.monthlyValue) * dir;
        if (sortKey === 'contractEnd')
          return (new Date(a.contractEnd).getTime() - new Date(b.contractEnd).getTime()) * dir;
        if (sortKey === 'status') return a.status.localeCompare(b.status) * dir;
        return a.company.localeCompare(b.company) * dir;
      });
  }, [clients, search, statusFilter, sortKey, sortAsc]);

  function toggleSort(key: SortKey): void {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  function handleDelete(client: Client): void {
    const linked = receivables.some((r) => r.clientId === client.id);
    if (linked) {
      toast('Cliente vinculado', {
        description: `${client.company} possui lançamentos. Remova-os antes.`,
        tone: 'warning',
      });
      return;
    }
    if (window.confirm(`Excluir ${client.company}?`)) {
      void removeClient(client.id).then(() => {
        toast('Cliente removido', { description: client.company, tone: 'info' });
      });
    }
  }

  const pipelineStats = useMemo(() => {
    const inPipeline = clients.filter((c) => c.pipelineStage && c.pipelineStage !== 'won' && c.pipelineStage !== 'lost');
    const totalPipelineValue = inPipeline.reduce((acc, c) => acc + (c.estimatedValue ?? c.monthlyValue), 0);
    return { count: inPipeline.length, value: totalPipelineValue };
  }, [clients]);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight leading-tight">CRM</h1>
          <p className="text-[12px] text-muted-foreground">Pipeline de leads e base de clientes.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-md border border-border bg-card p-0.5">
            <ViewToggle active={view === 'pipeline'} onClick={() => setView('pipeline')} icon={<KanbanSquare className="h-3.5 w-3.5" />} label="Pipeline" />
            <ViewToggle active={view === 'table'} onClick={() => setView('table')} icon={<Table2 className="h-3.5 w-3.5" />} label="Tabela" />
          </div>
          <Button variant="outline" size="sm" onClick={() => setImporting(true)}>
            <Upload className="h-3.5 w-3.5" /> Importar planilha
          </Button>
          <Button variant="accent" size="sm" onClick={() => { setCreateStage(null); setCreating(true); }}>
            <Plus className="h-3.5 w-3.5" /> Novo lead
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="Clientes Ativos" value={String(stats.activeCount)} icon={<Users className="h-3.5 w-3.5" />} />
        <StatBox label="MRR Total" value={formatBRL(stats.mrr)} accent />
        <StatBox label="Ticket Médio" value={formatBRL(stats.ticket)} />
        <StatBox
          label="Pipeline"
          value={`${pipelineStats.count} · ${formatBRL(pipelineStats.value)}`}
        />
      </section>

      {view === 'pipeline' && (
        <LeadsKanban
          onOpenClient={(id) => setOpenDetailId(id)}
          onCreateInStage={(stage) => { setCreateStage(stage); setCreating(true); }}
        />
      )}

      {view === 'table' && (
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row gap-3 p-5 border-b border-border">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por empresa, contato, e-mail ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | ClientStatus)}>
              <SelectTrigger className="md:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="paused">Pausados</SelectItem>
                <SelectItem value="churned">Churned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  <th className="text-left py-3 px-5 font-medium cursor-pointer hover:text-foreground" onClick={() => toggleSort('company')}>
                    Empresa
                  </th>
                  <th className="text-left py-3 px-5 font-medium hidden md:table-cell">Contato</th>
                  <th
                    className="text-right py-3 px-5 font-medium cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort('monthlyValue')}
                  >
                    Valor mensal
                  </th>
                  <th
                    className="text-left py-3 px-5 font-medium hidden lg:table-cell cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort('contractEnd')}
                  >
                    Renovação
                  </th>
                  <th
                    className="text-left py-3 px-5 font-medium cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort('status')}
                  >
                    Status
                  </th>
                  <th className="py-3 px-5" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                )}
                {filtered.map((client, idx) => {
                  const renewalDays = daysUntil(client.contractEnd);
                  const renewalSoon = renewalDays >= 0 && renewalDays <= 30;
                  return (
                    <motion.tr
                      key={client.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="border-t border-border hover:bg-secondary/20 cursor-pointer transition-colors"
                      onClick={() => setOpenDetailId(client.id)}
                    >
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full h-8 w-8 bg-gradient-azure flex items-center justify-center text-white text-xs font-medium shrink-0">
                            {client.company.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{client.company}</p>
                            <p className="text-xs text-muted-foreground truncate hidden sm:block">{client.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-5 hidden md:table-cell text-muted-foreground">{client.contactName || '—'}</td>
                      <td className="py-3 px-5 text-right tabular font-medium">{formatBRL(client.monthlyValue)}</td>
                      <td className="py-3 px-5 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground tabular text-xs">{formatDate(client.contractEnd)}</span>
                          {renewalSoon && (
                            <Badge variant="warning" className="px-1.5 py-0">
                              <AlertCircle className="h-3 w-3" />
                              {renewalDays}d
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <ClientStatusBadge status={client.status} />
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditing(client)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(client)}
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
      )}

      <Dialog open={creating || Boolean(editing)} onOpenChange={(o) => {
        if (!o) {
          setCreating(false);
          setEditing(null);
          setCreateStage(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? `Editar ${editing.company}` : 'Novo cliente'}</DialogTitle>
          </DialogHeader>
          <ClientForm
            initial={editing ?? undefined}
            defaultStage={createStage ?? undefined}
            onSubmit={async (client) => {
              const isNew = !editing;
              await upsertClient(client);
              setCreating(false);
              setEditing(null);
              setCreateStage(null);
              toast(isNew ? 'Lead criado' : 'Lead atualizado', { description: client.company });
            }}
            onCancel={() => {
              setCreating(false);
              setEditing(null);
              setCreateStage(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <ClientDetailDrawer clientId={openDetailId} onClose={() => setOpenDetailId(null)} />

      <ImportSpreadsheetModal
        open={importing}
        onOpenChange={setImporting}
        defaultEntity="clients"
      />
    </div>
  );
}

function ViewToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 h-7 rounded text-[11px] font-medium transition-colors',
        active
          ? 'bg-secondary text-foreground border border-border'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function StatBox({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Card className={cn(accent && 'border-accent/30')}>
      <CardContent className="p-3.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
          {icon && <span className="text-muted-foreground">{icon}</span>}
        </div>
        <p className={cn('font-display text-lg tabular tracking-tight font-semibold', accent && 'text-gradient-accent')}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
