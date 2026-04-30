import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Mail, MoreHorizontal, Plus, Sparkle, TrendingUp } from 'lucide-react';
import { useStore } from '@/stores/useStore';
import { toast } from '@/components/shell/Toaster';
import { formatBRL, whatsappLink } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Client, PipelineStage } from '@/types';

interface LeadsKanbanProps {
  onOpenClient: (id: string) => void;
  onCreateInStage: (stage: PipelineStage) => void;
}

interface ColumnDef {
  key: PipelineStage;
  label: string;
  hint: string;
  accent: string;
  dot: string;
}

const COLUMNS: ColumnDef[] = [
  { key: 'lead', label: 'Lead', hint: 'Novo contato', accent: 'border-cosmos-azure/30', dot: 'bg-cosmos-azure' },
  { key: 'contact', label: 'Contato', hint: 'Conversa iniciada', accent: 'border-blue-500/30', dot: 'bg-blue-400' },
  { key: 'proposal', label: 'Proposta', hint: 'Aguardando retorno', accent: 'border-warning/40', dot: 'bg-warning' },
  { key: 'negotiation', label: 'Negociação', hint: 'Quase fechado', accent: 'border-cosmos-mist/40', dot: 'bg-cosmos-mist' },
  { key: 'won', label: 'Cliente Ativo', hint: 'Fechado · ganho', accent: 'border-accent/40', dot: 'bg-accent' },
];

const PRIORITY_LABEL: Record<NonNullable<Client['priority']>, { label: string; cls: string }> = {
  high: { label: 'Alta', cls: 'bg-destructive/15 text-destructive border-destructive/30' },
  medium: { label: 'Média', cls: 'bg-warning/15 text-warning border-warning/30' },
  low: { label: 'Baixa', cls: 'bg-muted/40 text-muted-foreground border-border' },
};

export function LeadsKanban({ onOpenClient, onCreateInStage }: LeadsKanbanProps) {
  const clients = useStore((s) => s.clients);
  const upsertClient = useStore((s) => s.upsertClient);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<PipelineStage | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<PipelineStage, Client[]>();
    for (const col of COLUMNS) map.set(col.key, []);
    for (const c of clients) {
      if (c.pipelineStage === 'lost') continue;
      map.get(c.pipelineStage ?? 'lead')?.push(c);
    }
    return map;
  }, [clients]);

  const totals = useMemo(() => {
    const map = new Map<PipelineStage, { count: number; value: number }>();
    for (const col of COLUMNS) {
      const items = grouped.get(col.key) ?? [];
      const value = items.reduce((acc, c) => acc + (c.estimatedValue ?? c.monthlyValue), 0);
      map.set(col.key, { count: items.length, value });
    }
    return map;
  }, [grouped]);

  function onDragStart(event: React.DragEvent<HTMLDivElement>, id: string): void {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);
    setDraggingId(id);
  }

  function onDragEnd(): void {
    setDraggingId(null);
    setDragOverColumn(null);
  }

  function onDragOver(event: React.DragEvent<HTMLDivElement>, stage: PipelineStage): void {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== stage) setDragOverColumn(stage);
  }

  async function onDrop(event: React.DragEvent<HTMLDivElement>, stage: PipelineStage): Promise<void> {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain');
    setDragOverColumn(null);
    setDraggingId(null);
    const client = clients.find((c) => c.id === id);
    if (!client || client.pipelineStage === stage) return;

    const updates: Partial<Client> = { pipelineStage: stage };
    if (stage === 'won' && client.status !== 'active') {
      updates.status = 'active';
    }
    if (stage === 'lost' && client.status !== 'churned') {
      updates.status = 'churned';
    }
    await upsertClient({ ...client, ...updates });
    const target = COLUMNS.find((c) => c.key === stage);
    toast(`${client.company} → ${target?.label ?? stage}`, {
      description: 'Pipeline atualizado',
      tone: stage === 'won' ? 'success' : 'info',
    });
  }

  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {COLUMNS.map((col) => {
        const items = grouped.get(col.key) ?? [];
        const stats = totals.get(col.key) ?? { count: 0, value: 0 };
        const isOver = dragOverColumn === col.key;
        return (
          <div
            key={col.key}
            onDragOver={(e) => onDragOver(e, col.key)}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(e) => onDrop(e, col.key)}
            className={cn(
              'flex flex-col rounded-lg border bg-card/40 transition-colors duration-200 min-w-0',
              isOver ? 'border-accent/60 bg-accent/5' : col.accent,
            )}
          >
            <header className="flex items-start justify-between gap-2 px-2.5 py-2 border-b border-border/60">
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', col.dot)} />
                <div className="min-w-0">
                  <p className="text-[12px] font-medium leading-tight truncate">{col.label}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{col.hint}</p>
                </div>
              </div>
              <span className="text-[10px] tabular text-muted-foreground bg-secondary/50 border border-border rounded-full px-1.5 py-0 shrink-0">
                {stats.count}
              </span>
            </header>

            <div className="px-2.5 py-1.5 border-b border-border/60 flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground uppercase tracking-wider">Total</span>
              <span className="tabular text-foreground truncate ml-1">{formatBRL(stats.value)}</span>
            </div>

            <ul className="flex-1 p-1.5 space-y-1.5 min-h-[160px]">
              {items.length === 0 && (
                <li className="rounded-md border border-dashed border-border/60 bg-secondary/20 py-6 text-center">
                  <p className="text-[11px] text-muted-foreground">Sem leads</p>
                </li>
              )}
              {items.map((client, idx) => (
                <KanbanCard
                  key={client.id}
                  client={client}
                  index={idx}
                  isDragging={draggingId === client.id}
                  onDragStart={(e) => onDragStart(e, client.id)}
                  onDragEnd={onDragEnd}
                  onClick={() => onOpenClient(client.id)}
                />
              ))}
            </ul>

            <footer className="p-1.5 border-t border-border/60">
              <button
                onClick={() => onCreateInStage(col.key)}
                className="w-full flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] text-muted-foreground hover:text-accent hover:bg-secondary/40 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Adicionar lead
              </button>
            </footer>
          </div>
        );
      })}
    </div>
  );
}

interface KanbanCardProps {
  client: Client;
  index: number;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onClick: () => void;
}

function KanbanCard({ client, index, isDragging, onDragStart, onDragEnd, onClick }: KanbanCardProps) {
  const priority = client.priority ?? 'medium';
  const priorityMeta = PRIORITY_LABEL[priority];

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isDragging ? 0.4 : 1, y: 0, scale: isDragging ? 0.97 : 1 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
    >
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={onClick}
        className="group cursor-grab active:cursor-grabbing rounded-md border border-border bg-card hover:border-accent/40 hover:shadow-glow transition-all p-2 space-y-2"
      >
        <div className="flex items-start gap-2">
          <div className="h-7 w-7 rounded-md bg-gradient-azure flex items-center justify-center text-white text-[10px] font-medium shrink-0">
            {client.company.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium leading-tight truncate">{client.company}</p>
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">{client.contactName || 'Sem contato'}</p>
          </div>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            <MoreHorizontal className="h-3 w-3" />
          </button>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          <span className={cn('px-1.5 py-0 rounded text-[9px] uppercase tracking-wider border', priorityMeta.cls)}>
            {priorityMeta.label}
          </span>
          {client.source && (
            <span className="px-1.5 py-0 rounded text-[9px] border border-border bg-secondary/40 text-muted-foreground inline-flex items-center gap-0.5 truncate max-w-[100px]">
              <Sparkle className="h-2 w-2 shrink-0" />
              <span className="truncate">{client.source}</span>
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-border/60 gap-2">
          <div className="flex items-center gap-1 text-[10px] text-accent tabular font-medium min-w-0">
            <TrendingUp className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{formatBRL(client.estimatedValue ?? client.monthlyValue)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground shrink-0" onClick={(e) => e.stopPropagation()}>
            {client.phone && (
              <a
                href={whatsappLink(client.phone)}
                target="_blank"
                rel="noreferrer"
                className="hover:text-accent transition-colors"
                title="WhatsApp"
              >
                <MessageCircle className="h-3 w-3" />
              </a>
            )}
            {client.email && (
              <a
                href={`mailto:${client.email}`}
                className="hover:text-foreground transition-colors"
                title="Email"
              >
                <Mail className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.li>
  );
}
