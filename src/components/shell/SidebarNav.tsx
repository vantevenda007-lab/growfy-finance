import { motion } from 'framer-motion';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  LayoutDashboard,
  Users,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type TabKey = 'dashboard' | 'crm' | 'receivables' | 'payables' | 'cashflow';

const TABS: { key: TabKey; label: string; icon: LucideIcon; sub: string; shortcut: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, sub: 'Visão geral', shortcut: '1' },
  { key: 'crm', label: 'CRM', icon: Users, sub: 'Clientes', shortcut: '2' },
  { key: 'receivables', label: 'A Receber', icon: ArrowDownToLine, sub: 'Entradas', shortcut: '3' },
  { key: 'payables', label: 'A Pagar', icon: ArrowUpFromLine, sub: 'Saídas', shortcut: '4' },
  { key: 'cashflow', label: 'Fluxo', icon: Waves, sub: 'Consolidado', shortcut: '5' },
];

interface SidebarNavProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

export function SidebarNav({ active, onChange }: SidebarNavProps) {
  return (
    <nav className="hidden lg:flex flex-col w-[200px] shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] py-4 px-2.5 border-r border-border/60">
      <span className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground/70 px-2.5 mb-1.5">
        Operação
      </span>
      <ul className="flex flex-col gap-0.5">
        {TABS.map((tab) => {
          const isActive = active === tab.key;
          const Icon = tab.icon;
          return (
            <li key={tab.key}>
              <button
                onClick={() => onChange(tab.key)}
                className={cn(
                  'group relative w-full flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left transition-colors',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-md bg-secondary/80 border border-border"
                    transition={{ type: 'spring', bounce: 0.18, duration: 0.5 }}
                  />
                )}
                <Icon className={cn('relative z-10 h-3.5 w-3.5 shrink-0', isActive && 'text-accent')} />
                <span className="relative z-10 text-[13px] font-medium flex-1">{tab.label}</span>
                <kbd className={cn(
                  'relative z-10 px-1.5 py-0 text-[9px] tabular rounded border transition-colors',
                  isActive
                    ? 'border-border bg-card/80 text-muted-foreground'
                    : 'border-transparent text-transparent group-hover:border-border group-hover:bg-card/40 group-hover:text-muted-foreground',
                )}>
                  {tab.shortcut}
                </kbd>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 mb-1.5 px-2.5">
        <span className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground/70">
          Atalhos
        </span>
      </div>
      <div className="px-2.5 space-y-1.5 text-[11px] text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Buscar</span>
          <kbd className="px-1.5 py-0 rounded border border-border bg-card/40 tabular text-[9px]">⌘K</kbd>
        </div>
        <div className="flex items-center justify-between">
          <span>Tema</span>
          <kbd className="px-1.5 py-0 rounded border border-border bg-card/40 tabular text-[9px]">T</kbd>
        </div>
      </div>

      <div className="mt-auto mx-0.5 rounded-lg border border-border bg-card/60 p-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Status</p>
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inset-0 rounded-full bg-accent animate-glow-pulse" />
            <span className="relative rounded-full h-1.5 w-1.5 bg-accent" />
          </span>
        </div>
        <p className="text-[11px] text-foreground mt-1">Sincronizado</p>
        <p className="text-[9px] text-muted-foreground">IndexedDB · v1</p>
      </div>
    </nav>
  );
}

export const TAB_LIST = TABS;
