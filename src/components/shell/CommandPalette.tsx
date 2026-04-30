import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  LayoutDashboard,
  Moon,
  RotateCcw,
  Search,
  Sun,
  Users,
  Waves,
  Download,
} from 'lucide-react';
import { useStore } from '@/stores/useStore';
import { exportBackup } from '@/lib/db';
import { toast } from './Toaster';
import { cn } from '@/lib/utils';
import type { TabKey } from './SidebarNav';

interface CommandPaletteProps {
  active: TabKey;
  onNavigate: (tab: TabKey) => void;
}

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
  run: () => void;
}

export function CommandPalette({ active, onNavigate }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const theme = useStore((s) => s.theme);
  const resetSeed = useStore((s) => s.resetSeed);

  useEffect(() => {
    function onKey(event: KeyboardEvent): void {
      const isModK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (isModK) {
        event.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (event.key === 'Escape' && open) {
        event.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setHighlight(0);
    }
  }, [open]);

  const commands: Command[] = useMemo(() => {
    const navCommands: Command[] = [
      { id: 'nav-dashboard', label: 'Ir para Dashboard', icon: LayoutDashboard, group: 'Navegação', hint: 'D', run: () => onNavigate('dashboard') },
      { id: 'nav-crm', label: 'Ir para CRM', icon: Users, group: 'Navegação', hint: 'C', run: () => onNavigate('crm') },
      { id: 'nav-rec', label: 'Ir para Contas a Receber', icon: ArrowDownToLine, group: 'Navegação', hint: 'R', run: () => onNavigate('receivables') },
      { id: 'nav-pay', label: 'Ir para Contas a Pagar', icon: ArrowUpFromLine, group: 'Navegação', hint: 'P', run: () => onNavigate('payables') },
      { id: 'nav-flow', label: 'Ir para Fluxo de Caixa', icon: Waves, group: 'Navegação', hint: 'F', run: () => onNavigate('cashflow') },
    ].filter((c) => !c.id.endsWith(active));

    const actions: Command[] = [
      {
        id: 'theme',
        label: theme === 'dark' ? 'Tema claro' : 'Tema escuro',
        icon: theme === 'dark' ? Sun : Moon,
        group: 'Ações',
        run: () => {
          toggleTheme();
          toast('Tema alterado', { description: theme === 'dark' ? 'Modo claro' : 'Modo escuro', tone: 'info' });
        },
      },
      {
        id: 'export',
        label: 'Exportar backup JSON',
        icon: Download,
        group: 'Ações',
        run: async () => {
          const bundle = await exportBackup();
          const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `growfy-finance-backup-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          URL.revokeObjectURL(url);
          toast('Backup exportado', { description: 'Arquivo baixado com sucesso.' });
        },
      },
      {
        id: 'reset',
        label: 'Resetar dados (seed demo)',
        icon: RotateCcw,
        group: 'Ações',
        run: async () => {
          if (window.confirm('Resetar todos os dados?')) {
            await resetSeed();
            toast('Dados resetados', { description: 'Base recarregada com seed.', tone: 'info' });
          }
        },
      },
    ];

    return [...navCommands, ...actions];
  }, [active, onNavigate, theme, toggleTheme, resetSeed]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q));
  }, [commands, query]);

  function execute(idx: number): void {
    const cmd = filtered[idx];
    if (!cmd) return;
    setOpen(false);
    setTimeout(() => cmd.run(), 80);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      execute(highlight);
    }
  }

  const groups = filtered.reduce<Record<string, Command[]>>((acc, c) => {
    acc[c.group] = acc[c.group] ?? [];
    acc[c.group].push(c);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-start justify-center pt-[12vh] px-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-cosmos-void/70 backdrop-blur-md"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative w-full max-w-xl rounded-xl glass-elevated border border-border overflow-hidden shadow-cinema"
          >
            <div className="flex items-center gap-3 px-4 border-b border-border">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlight(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Buscar ações, navegar..."
                className="flex-1 h-12 bg-transparent text-sm placeholder:text-muted-foreground/60 focus:outline-none"
              />
              <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-secondary/40 text-muted-foreground">ESC</kbd>
            </div>
            <div className="max-h-[50vh] overflow-y-auto py-2">
              {filtered.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">Nenhum resultado.</p>
              )}
              {Object.entries(groups).map(([group, items]) => (
                <div key={group} className="px-2 pb-2">
                  <p className="px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {group}
                  </p>
                  {items.map((cmd) => {
                    const idx = filtered.indexOf(cmd);
                    const isActive = idx === highlight;
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.id}
                        onMouseEnter={() => setHighlight(idx)}
                        onClick={() => execute(idx)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm transition-colors',
                          isActive ? 'bg-secondary/60 text-foreground' : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        <span className={cn(
                          'rounded-md p-1.5 border',
                          isActive ? 'bg-accent/15 border-accent/40 text-accent' : 'bg-white/[0.03] border-white/[0.05]',
                        )}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="flex-1">{cmd.label}</span>
                        {cmd.hint && (
                          <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-secondary/40 text-muted-foreground">
                            {cmd.hint}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-border flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <span>Growfy Finance · Command</span>
              <span className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 rounded border border-border bg-secondary/40">↑↓</kbd>
                <kbd className="px-1.5 py-0.5 rounded border border-border bg-secondary/40">↵</kbd>
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
