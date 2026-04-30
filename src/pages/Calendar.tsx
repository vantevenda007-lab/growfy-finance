import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  ListTodo,
  MapPin,
  Pencil,
  Plus,
  Target,
  Trash2,
  Users,
} from 'lucide-react';
import { useStore } from '@/stores/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EventForm } from '@/components/calendar/EventForm';
import { toast } from '@/components/shell/Toaster';
import { cn } from '@/lib/utils';
import type { CalendarEvent, CalendarEventType } from '@/types';

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const TYPE_META: Record<
  CalendarEventType,
  { label: string; icon: typeof CalendarIcon; dot: string; chip: string; ring: string }
> = {
  meeting: {
    label: 'Reunião',
    icon: Users,
    dot: 'bg-[#7c8cff]',
    chip: 'bg-[#7c8cff]/15 text-[#a3b0ff] border-[#7c8cff]/30',
    ring: 'ring-[#7c8cff]/40',
  },
  task: {
    label: 'Tarefa',
    icon: ListTodo,
    dot: 'bg-[#f5a524]',
    chip: 'bg-[#f5a524]/15 text-[#f5b94e] border-[#f5a524]/30',
    ring: 'ring-[#f5a524]/40',
  },
  reminder: {
    label: 'Lembrete',
    icon: CalendarIcon,
    dot: 'bg-[#9aa5b1]',
    chip: 'bg-[#9aa5b1]/15 text-[#cbd5e1] border-[#9aa5b1]/30',
    ring: 'ring-[#9aa5b1]/40',
  },
  deadline: {
    label: 'Prazo',
    icon: Flag,
    dot: 'bg-[#f87171]',
    chip: 'bg-[#f87171]/15 text-[#fca5a5] border-[#f87171]/30',
    ring: 'ring-[#f87171]/40',
  },
  milestone: {
    label: 'Marco',
    icon: Target,
    dot: 'bg-accent',
    chip: 'bg-accent/15 text-accent border-accent/30',
    ring: 'ring-accent/40',
  },
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function startOfMonth(year: number, monthIndex: number): Date {
  return new Date(year, monthIndex, 1);
}

function buildMonthGrid(year: number, monthIndex: number): Date[] {
  const first = startOfMonth(year, monthIndex);
  // Monday-first: shift weekday so Monday=0
  const dow = (first.getDay() + 6) % 7;
  const start = new Date(year, monthIndex, 1 - dow);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i += 1) {
    cells.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }
  return cells;
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const MONTH_NAMES_LONG = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export function Calendar() {
  const events = useStore((s) => s.events);
  const upsertEvent = useStore((s) => s.upsertEvent);
  const removeEvent = useStore((s) => s.removeEvent);

  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), monthIndex: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [createDate, setCreateDate] = useState<string | null>(null);

  const grid = useMemo(
    () => buildMonthGrid(cursor.year, cursor.monthIndex),
    [cursor.year, cursor.monthIndex],
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const arr = map.get(ev.date) ?? [];
      arr.push(ev);
      map.set(ev.date, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => {
        if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
        return (a.startTime ?? '99:99').localeCompare(b.startTime ?? '99:99');
      });
    }
    return map;
  }, [events]);

  const selectedEvents = eventsByDay.get(selectedDate) ?? [];

  const upcoming = useMemo(() => {
    const today = todayISO();
    return events
      .filter((e) => e.date >= today && !e.completed)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.startTime ?? '99:99').localeCompare(b.startTime ?? '99:99');
      })
      .slice(0, 6);
  }, [events]);

  const stats = useMemo(() => {
    const today = todayISO();
    const monthPrefix = `${cursor.year}-${String(cursor.monthIndex + 1).padStart(2, '0')}`;
    const monthEvents = events.filter((e) => e.date.startsWith(monthPrefix));
    const todayCount = events.filter((e) => e.date === today).length;
    const overdue = events.filter((e) => e.date < today && !e.completed).length;
    const completed = monthEvents.filter((e) => e.completed).length;
    return { monthCount: monthEvents.length, todayCount, overdue, completed };
  }, [events, cursor]);

  function shiftMonth(delta: number): void {
    const next = new Date(cursor.year, cursor.monthIndex + delta, 1);
    setCursor({ year: next.getFullYear(), monthIndex: next.getMonth() });
  }

  function goToday(): void {
    const now = new Date();
    setCursor({ year: now.getFullYear(), monthIndex: now.getMonth() });
    setSelectedDate(todayISO());
  }

  function openCreate(date?: string): void {
    setCreateDate(date ?? selectedDate);
    setCreating(true);
  }

  async function toggleComplete(ev: CalendarEvent): Promise<void> {
    await upsertEvent({ ...ev, completed: !ev.completed });
    toast(ev.completed ? 'Reaberto' : 'Marcado como concluído', {
      description: ev.title,
      tone: ev.completed ? 'info' : 'success',
    });
  }

  async function handleDelete(ev: CalendarEvent): Promise<void> {
    if (!window.confirm(`Excluir "${ev.title}"?`)) return;
    await removeEvent(ev.id);
    toast('Compromisso removido', { description: ev.title, tone: 'info' });
  }

  const monthLabel = `${MONTH_NAMES_LONG[cursor.monthIndex]} ${cursor.year}`;
  const today = todayISO();

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1.5">
            Agenda
          </p>
          <h1 className="font-brand text-[44px] leading-[0.95] tracking-tight capitalize">
            {monthLabel}
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-md border border-border bg-card/40">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => shiftMonth(-1)}
              className="h-8 w-8 rounded-l-md rounded-r-none"
              title="Mês anterior"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <button
              onClick={goToday}
              className="h-8 px-3 text-[11px] font-medium border-x border-border hover:bg-secondary/40 transition-colors"
            >
              Hoje
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => shiftMonth(1)}
              className="h-8 w-8 rounded-r-md rounded-l-none"
              title="Próximo mês"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button variant="accent" size="sm" onClick={() => openCreate()}>
            <Plus className="h-3.5 w-3.5" /> Novo compromisso
          </Button>
        </div>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBlock label="Hoje" value={String(stats.todayCount)} icon={<CalendarIcon className="h-3.5 w-3.5" />} />
        <StatBlock label="No mês" value={String(stats.monthCount)} icon={<Briefcase className="h-3.5 w-3.5" />} />
        <StatBlock label="Concluídos" value={String(stats.completed)} icon={<Check className="h-3.5 w-3.5" />} accent="success" />
        <StatBlock label="Atrasados" value={String(stats.overdue)} icon={<Flag className="h-3.5 w-3.5" />} accent={stats.overdue > 0 ? 'danger' : undefined} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        {/* Calendar grid */}
        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b border-border bg-card/50">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="px-3 py-2.5 text-[10px] uppercase tracking-[0.24em] text-muted-foreground text-center"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 grid-rows-6">
              {grid.map((d, idx) => {
                const key = dateKey(d);
                const inMonth = d.getMonth() === cursor.monthIndex;
                const isToday = key === today;
                const isSelected = key === selectedDate;
                const dayEvents = eventsByDay.get(key) ?? [];
                const visible = dayEvents.slice(0, 3);
                const overflow = dayEvents.length - visible.length;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(key)}
                    onDoubleClick={() => openCreate(key)}
                    className={cn(
                      'group relative flex flex-col gap-1 min-h-[96px] px-2 pt-2 pb-1.5 border-r border-b border-border/60 text-left transition-colors',
                      'hover:bg-secondary/30',
                      !inMonth && 'bg-card/20 text-muted-foreground/50',
                      isSelected && 'bg-secondary/50',
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full font-brand text-[14px] tabular tracking-tight',
                          isToday
                            ? 'bg-accent text-data-ink font-semibold'
                            : isSelected
                            ? 'text-foreground'
                            : 'text-foreground/80',
                        )}
                      >
                        {d.getDate()}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[9px] tabular text-muted-foreground mt-1">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 mt-0.5">
                      {visible.map((ev) => {
                        const meta = TYPE_META[ev.type];
                        return (
                          <span
                            key={ev.id}
                            className={cn(
                              'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] truncate',
                              meta.chip,
                              ev.completed && 'opacity-50 line-through',
                            )}
                            title={ev.title}
                          >
                            {!ev.allDay && ev.startTime && (
                              <span className="tabular text-[9px] opacity-80 shrink-0">
                                {ev.startTime}
                              </span>
                            )}
                            <span className="truncate">{ev.title}</span>
                          </span>
                        );
                      })}
                      {overflow > 0 && (
                        <span className="text-[9px] text-muted-foreground pl-1">
                          + {overflow}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Side panel */}
        <aside className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-baseline justify-between mb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                    Selecionado
                  </p>
                  <p className="font-brand text-[22px] leading-tight tracking-tight capitalize">
                    {formatLongDate(selectedDate)}
                  </p>
                </div>
                <button
                  onClick={() => openCreate(selectedDate)}
                  className="text-[11px] text-accent hover:underline underline-offset-4"
                >
                  + adicionar
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedDate}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {selectedEvents.length === 0 ? (
                    <div className="rounded-md border border-dashed border-border bg-card/30 py-8 text-center">
                      <p className="text-[12px] text-muted-foreground">Sem compromissos</p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {selectedEvents.map((ev) => (
                        <EventRow
                          key={ev.id}
                          event={ev}
                          onToggle={() => toggleComplete(ev)}
                          onEdit={() => setEditing(ev)}
                          onDelete={() => handleDelete(ev)}
                        />
                      ))}
                    </ul>
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  Próximos
                </p>
                <span className="text-[10px] text-muted-foreground tabular">
                  {upcoming.length}
                </span>
              </div>
              {upcoming.length === 0 ? (
                <p className="text-[11px] text-muted-foreground py-2">
                  Nada na agenda dos próximos dias.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {upcoming.map((ev) => {
                    const meta = TYPE_META[ev.type];
                    return (
                      <li
                        key={ev.id}
                        onClick={() => {
                          setSelectedDate(ev.date);
                          const d = new Date(ev.date);
                          setCursor({ year: d.getFullYear(), monthIndex: d.getMonth() });
                        }}
                        className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-secondary/40 cursor-pointer transition-colors"
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', meta.dot)} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-medium truncate">{ev.title}</p>
                          <p className="text-[10px] text-muted-foreground tabular truncate">
                            {formatRelativeDate(ev.date)}
                            {!ev.allDay && ev.startTime && ` · ${ev.startTime}`}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog
        open={creating || Boolean(editing)}
        onOpenChange={(o) => {
          if (!o) {
            setCreating(false);
            setEditing(null);
            setCreateDate(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? `Editar · ${editing.title}` : 'Novo compromisso'}
            </DialogTitle>
          </DialogHeader>
          <EventForm
            initial={editing ?? undefined}
            defaultDate={createDate ?? selectedDate}
            onSubmit={async (event) => {
              const isNew = !editing;
              await upsertEvent(event);
              setCreating(false);
              setEditing(null);
              setCreateDate(null);
              toast(isNew ? 'Compromisso criado' : 'Compromisso atualizado', {
                description: event.title,
              });
            }}
            onCancel={() => {
              setCreating(false);
              setEditing(null);
              setCreateDate(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface EventRowProps {
  event: CalendarEvent;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function EventRow({ event, onToggle, onEdit, onDelete }: EventRowProps) {
  const clients = useStore((s) => s.clients);
  const meta = TYPE_META[event.type];
  const Icon = meta.icon;
  const linkedClient = event.clientId ? clients.find((c) => c.id === event.clientId) : null;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'group rounded-lg border bg-card/40 px-3 py-2.5 transition-colors',
        event.completed ? 'border-border/40 opacity-60' : 'border-border hover:border-accent/30',
      )}
    >
      <div className="flex items-start gap-2.5">
        <button
          onClick={onToggle}
          className={cn(
            'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors',
            event.completed
              ? 'bg-accent border-accent text-data-ink'
              : 'border-muted-foreground/40 hover:border-accent',
          )}
          title={event.completed ? 'Reabrir' : 'Concluir'}
        >
          {event.completed && <Check className="h-2.5 w-2.5" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0 rounded text-[9px] uppercase tracking-wider border',
                meta.chip,
              )}
            >
              <Icon className="h-2.5 w-2.5" />
              {meta.label}
            </span>
            {event.priority === 'high' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0 rounded text-[9px] uppercase tracking-wider border bg-destructive/10 text-destructive border-destructive/30">
                <Flag className="h-2.5 w-2.5" />
                Alta
              </span>
            )}
          </div>

          <p
            className={cn(
              'text-[13px] font-medium leading-tight mt-1.5',
              event.completed && 'line-through',
            )}
          >
            {event.title}
          </p>
          {event.description && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
              {event.description}
            </p>
          )}

          <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground mt-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 tabular">
              <Clock className="h-2.5 w-2.5" />
              {event.allDay
                ? 'Dia todo'
                : `${event.startTime ?? '—'}${event.endTime ? ` – ${event.endTime}` : ''}`}
            </span>
            {event.location && (
              <span className="inline-flex items-center gap-1 truncate max-w-[160px]">
                <MapPin className="h-2.5 w-2.5" />
                {event.location}
              </span>
            )}
            {linkedClient && (
              <span className="inline-flex items-center gap-1 truncate max-w-[160px]">
                <Users className="h-2.5 w-2.5" />
                {linkedClient.company}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="h-6 w-6 rounded hover:bg-secondary/60 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
            title="Editar"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={onDelete}
            className="h-6 w-6 rounded hover:bg-secondary/60 inline-flex items-center justify-center text-muted-foreground hover:text-destructive"
            title="Excluir"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </motion.li>
  );
}

function StatBlock({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  accent?: 'success' | 'danger';
}) {
  return (
    <Card
      className={cn(
        accent === 'success' && 'border-accent/30',
        accent === 'danger' && 'border-destructive/30',
      )}
    >
      <CardContent className="p-3.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </span>
          {icon && <span className="text-muted-foreground">{icon}</span>}
        </div>
        <p
          className={cn(
            'font-display text-lg tabular tracking-tight font-semibold',
            accent === 'success' && 'text-accent',
            accent === 'danger' && 'text-destructive',
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'][date.getDay()];
  return `${weekday}, ${d} de ${MONTH_NAMES_LONG[m - 1]}`;
}

function formatRelativeDate(iso: string): string {
  const today = todayISO();
  if (iso === today) return 'Hoje';
  const [ty, tm, td] = today.split('-').map(Number);
  const [y, m, d] = iso.split('-').map(Number);
  const diff = Math.round(
    (Date.UTC(y, m - 1, d) - Date.UTC(ty, tm - 1, td)) / (1000 * 60 * 60 * 24),
  );
  if (diff === 1) return 'Amanhã';
  if (diff > 1 && diff < 7) return `Em ${diff} dias`;
  if (diff >= 7 && diff < 14) return 'Próxima semana';
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}
