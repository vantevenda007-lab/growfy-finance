import { create } from 'zustand';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X, AlertOctagon } from 'lucide-react';
import { uid } from '@/lib/utils';
import { cn } from '@/lib/utils';

type ToastTone = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

export const useToast = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = uid('toast');
    set({ toasts: [...get().toasts, { id, ...toast }] });
    setTimeout(() => get().dismiss(id), 3500);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export function toast(title: string, options?: { description?: string; tone?: ToastTone }): void {
  useToast.getState().push({ title, description: options?.description, tone: options?.tone ?? 'success' });
}

const TONE: Record<ToastTone, { icon: React.ComponentType<{ className?: string }>; accent: string; ring: string }> = {
  success: { icon: CheckCircle2, accent: 'text-accent', ring: 'border-accent/40' },
  error: { icon: AlertOctagon, accent: 'text-destructive', ring: 'border-destructive/40' },
  info: { icon: Info, accent: 'text-blue-300', ring: 'border-cosmos-azure/40' },
  warning: { icon: AlertTriangle, accent: 'text-warning', ring: 'border-warning/40' },
};

export function Toaster() {
  const toasts = useToast((s) => s.toasts);
  const dismiss = useToast((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[80] flex flex-col gap-2 w-[340px]">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const meta = TONE[t.tone];
          const Icon = meta.icon;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 80, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className={cn(
                'pointer-events-auto rounded-lg glass-elevated p-4 flex items-start gap-3 border',
                meta.ring,
              )}
            >
              <div className={cn('mt-0.5', meta.accent)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">{t.title}</p>
                {t.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
