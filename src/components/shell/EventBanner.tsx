import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Check,
  Clock,
  ExternalLink,
  Flag,
  ListTodo,
  MapPin,
  Target,
  Timer,
  Users,
  X,
} from 'lucide-react';
import { uid } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types';

type Tone = 'meeting' | 'task' | 'reminder' | 'deadline' | 'milestone' | 'test';

interface BannerItem {
  id: string;
  title: string;
  body?: string;
  /** Optional ISO timestamp the event starts at — drives countdown chip. */
  eventAt?: string;
  /** Visual tone for accent colors and icon. */
  tone: Tone;
  priority?: 'low' | 'medium' | 'high';
  location?: string;
  client?: string;
  /** Optional click handler — usually focuses the agenda for that event. */
  onOpen?: () => void;
  /** Auto-dismiss after N ms. 0 / undefined = persist until user closes. */
  autoCloseMs?: number;
}

interface BannerState {
  items: BannerItem[];
  push: (item: Omit<BannerItem, 'id'>) => string;
  dismiss: (id: string) => void;
}

export const useEventBanner = create<BannerState>((set, get) => ({
  items: [],
  push: (item) => {
    const id = uid('banner');
    set({ items: [...get().items, { id, ...item }] });
    return id;
  },
  dismiss: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
}));

/** Rich helper: build a banner from a CalendarEvent. */
export function bannerFromEvent(event: CalendarEvent, opts?: { client?: string; onOpen?: () => void }): void {
  const eventAt = event.allDay
    ? `${event.date}T09:00:00`
    : `${event.date}T${event.startTime ?? '09:00'}:00`;
  useEventBanner.getState().push({
    title: event.title,
    body: event.description,
    eventAt,
    tone: event.type,
    priority: event.priority,
    location: event.location,
    client: opts?.client,
    onOpen: opts?.onOpen,
  });
}

/** Simpler legacy helper still used in some places. */
export function showEventBanner(args: {
  title: string;
  body: string;
  meta?: string;
  tone?: Tone;
}): void {
  useEventBanner.getState().push({
    title: args.title,
    body: args.body || args.meta,
    tone: args.tone ?? 'reminder',
    autoCloseMs: 8000,
  });
}

const TONE_META: Record<
  Tone,
  {
    label: string;
    icon: typeof Bell;
    chip: string;
    iconBox: string;
    edge: string;
    glow: string;
  }
> = {
  meeting: {
    label: 'Reunião',
    icon: Users,
    chip: 'bg-[#7c8cff]/15 text-[#a3b0ff] border-[#7c8cff]/40',
    iconBox: 'bg-[#7c8cff]/15 text-[#a3b0ff] border-[#7c8cff]/40',
    edge: 'before:bg-[#7c8cff]',
    glow: 'shadow-[0_0_60px_-20px_rgba(124,140,255,0.6)]',
  },
  task: {
    label: 'Tarefa',
    icon: ListTodo,
    chip: 'bg-[#f5a524]/15 text-[#f5b94e] border-[#f5a524]/40',
    iconBox: 'bg-[#f5a524]/15 text-[#f5b94e] border-[#f5a524]/40',
    edge: 'before:bg-[#f5a524]',
    glow: 'shadow-[0_0_60px_-20px_rgba(245,165,36,0.55)]',
  },
  reminder: {
    label: 'Lembrete',
    icon: Bell,
    chip: 'bg-accent/15 text-accent border-accent/40',
    iconBox: 'bg-accent/15 text-accent border-accent/40',
    edge: 'before:bg-accent',
    glow: 'shadow-[0_0_60px_-20px_rgba(93,214,44,0.55)]',
  },
  deadline: {
    label: 'Prazo',
    icon: Flag,
    chip: 'bg-[#f87171]/15 text-[#fca5a5] border-[#f87171]/40',
    iconBox: 'bg-[#f87171]/15 text-[#fca5a5] border-[#f87171]/40',
    edge: 'before:bg-[#f87171]',
    glow: 'shadow-[0_0_60px_-20px_rgba(248,113,113,0.55)]',
  },
  milestone: {
    label: 'Marco',
    icon: Target,
    chip: 'bg-accent/15 text-accent border-accent/40',
    iconBox: 'bg-accent/15 text-accent border-accent/40',
    edge: 'before:bg-accent',
    glow: 'shadow-[0_0_60px_-20px_rgba(93,214,44,0.55)]',
  },
  test: {
    label: 'Teste',
    icon: Bell,
    chip: 'bg-foreground/10 text-foreground/80 border-foreground/20',
    iconBox: 'bg-foreground/10 text-foreground/80 border-foreground/20',
    edge: 'before:bg-foreground/40',
    glow: 'shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]',
  },
};

export function EventBanner() {
  const items = useEventBanner((s) => s.items);

  return (
    <div className="pointer-events-none fixed top-20 right-6 z-[90] flex flex-col gap-3 w-[400px] max-w-[calc(100vw-3rem)]">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <BannerCard key={item.id} item={item} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface BannerCardProps {
  item: BannerItem;
}

function BannerCard({ item }: BannerCardProps) {
  const dismiss = useEventBanner((s) => s.dismiss);
  const meta = TONE_META[item.tone];
  const Icon = meta.icon;
  const [countdown, setCountdown] = useState(() => formatCountdown(item.eventAt));

  useEffect(() => {
    if (!item.eventAt) return undefined;
    const id = window.setInterval(() => setCountdown(formatCountdown(item.eventAt)), 30_000);
    return () => window.clearInterval(id);
  }, [item.eventAt]);

  useEffect(() => {
    if (!item.autoCloseMs) return undefined;
    const id = window.setTimeout(() => dismiss(item.id), item.autoCloseMs);
    return () => window.clearTimeout(id);
  }, [item.autoCloseMs, item.id, dismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className={cn(
        'group pointer-events-auto relative rounded-2xl overflow-hidden',
        'border border-white/10',
        meta.glow,
      )}
      style={{
        backgroundColor: 'rgba(14, 14, 18, 0.86)',
        backgroundImage:
          'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
        backdropFilter: 'blur(28px) saturate(140%)',
        WebkitBackdropFilter: 'blur(28px) saturate(140%)',
      }}
    >
      {/* Left edge accent */}
      <div
        aria-hidden
        className={cn(
          'absolute left-0 top-0 bottom-0 w-[3px]',
          meta.edge.replace('before:', ''),
        )}
      />

      {/* High-priority glow stripe */}
      {item.priority === 'high' && (
        <motion.div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-destructive/60"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <div className="relative flex items-start gap-3 p-4 pl-5">
        <div
          className={cn(
            'shrink-0 rounded-xl border h-10 w-10 flex items-center justify-center',
            meta.iconBox,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span
              className={cn(
                'inline-flex items-center px-1.5 py-0 rounded text-[9px] uppercase tracking-[0.18em] border',
                meta.chip,
              )}
            >
              {meta.label}
            </span>
            {item.priority === 'high' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0 rounded text-[9px] uppercase tracking-[0.18em] border bg-destructive/15 text-destructive border-destructive/40">
                <Flag className="h-2.5 w-2.5" /> Alta
              </span>
            )}
            {countdown && (
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] tabular text-foreground/60">
                <Timer className="h-2.5 w-2.5" />
                {countdown}
              </span>
            )}
          </div>

          <p className="font-brand text-[18px] leading-tight tracking-tight text-foreground">
            {item.title}
          </p>

          {item.body && (
            <p className="text-[12px] text-muted-foreground leading-relaxed mt-1.5 line-clamp-2">
              {item.body}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground mt-2">
            {item.eventAt && (
              <span className="inline-flex items-center gap-1 tabular">
                <Clock className="h-2.5 w-2.5" />
                {formatEventTime(item.eventAt)}
              </span>
            )}
            {item.location && (
              <span className="inline-flex items-center gap-1 truncate max-w-[160px]">
                <MapPin className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{item.location}</span>
              </span>
            )}
            {item.client && (
              <span className="inline-flex items-center gap-1 truncate max-w-[140px]">
                <Users className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{item.client}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-3">
            {item.onOpen && (
              <button
                onClick={() => {
                  item.onOpen?.();
                  dismiss(item.id);
                }}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-foreground text-background text-[11px] font-medium hover:bg-foreground/90 transition-colors"
              >
                <ExternalLink className="h-2.5 w-2.5" />
                Ver agenda
              </button>
            )}
            <button
              onClick={() => dismiss(item.id)}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-white/10 text-foreground/70 text-[11px] hover:bg-white/[0.04] hover:text-foreground transition-colors"
            >
              <Check className="h-2.5 w-2.5" />
              Ok
            </button>
            <button
              onClick={() => {
                /* simple "remind in 5" — re-pushes this banner after 5 min */
                const id = item.id;
                dismiss(id);
                window.setTimeout(() => {
                  useEventBanner.getState().push({
                    title: item.title,
                    body: item.body,
                    eventAt: item.eventAt,
                    tone: item.tone,
                    priority: item.priority,
                    location: item.location,
                    client: item.client,
                    onOpen: item.onOpen,
                  });
                }, 5 * 60_000);
              }}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-white/10 text-foreground/70 text-[11px] hover:bg-white/[0.04] hover:text-foreground transition-colors"
              title="Lembrar de novo em 5 min"
            >
              <Clock className="h-2.5 w-2.5" />
              5 min
            </button>
          </div>
        </div>

        <button
          onClick={() => dismiss(item.id)}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1 -mt-1 -mr-1"
          aria-label="Fechar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Optional progress bar for auto-dismiss */}
      {item.autoCloseMs ? (
        <motion.div
          aria-hidden
          className={cn('absolute bottom-0 left-0 right-0 h-px', meta.edge.replace('before:', ''))}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: item.autoCloseMs / 1000, ease: 'linear' }}
          style={{ transformOrigin: 'left' }}
        />
      ) : null}
    </motion.div>
  );
}

function formatCountdown(eventAt?: string): string | null {
  if (!eventAt) return null;
  const target = new Date(eventAt);
  if (Number.isNaN(target.getTime())) return null;
  const diffMs = target.getTime() - Date.now();
  if (diffMs <= -60_000) return 'agora há pouco';
  if (diffMs <= 60_000) return 'agora';
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 60) return `em ${diffMin}min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `em ${diffH}h`;
  return `em ${Math.round(diffH / 24)}d`;
}

function formatEventTime(eventAt: string): string {
  const d = new Date(eventAt);
  if (Number.isNaN(d.getTime())) return eventAt;
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (sameDay) return `Hoje · ${time}`;
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate();
  if (isTomorrow) return `Amanhã · ${time}`;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} · ${time}`;
}

