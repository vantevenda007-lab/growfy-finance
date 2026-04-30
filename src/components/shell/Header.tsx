import { Bell, Command, Download, LogOut, Moon, RotateCcw, Search, Sun, Upload } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Logo } from './Logo';
import { PeriodSelector } from './PeriodSelector';
import { Button } from '@/components/ui/button';
import { useStore } from '@/stores/useStore';
import { exportBackup, importBackup, type BackupBundle } from '@/lib/db';
import { toast } from './Toaster';
import { buildAlerts } from '@/lib/selectors';
import type { TabKey } from './SidebarNav';

const TAB_BREADCRUMB: Record<TabKey, string> = {
  dashboard: 'Dashboard',
  crm: 'CRM · Pipeline',
  receivables: 'A Receber',
  payables: 'A Pagar',
  cashflow: 'Fluxo de Caixa',
};

interface HeaderProps {
  active: TabKey;
  userEmail?: string;
  onSignOut?: () => void;
}

export function Header({ active, userEmail, onSignOut }: HeaderProps) {
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const resetSeed = useStore((s) => s.resetSeed);
  const clients = useStore((s) => s.clients);
  const receivables = useStore((s) => s.receivables);
  const payables = useStore((s) => s.payables);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileOpen) return undefined;
    function onDocClick(event: MouseEvent): void {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [profileOpen]);

  const initials = (userEmail ?? 'AG').slice(0, 2).toUpperCase();
  const userLabel = userEmail ? userEmail.split('@')[0] : 'Agência';

  const alertCount = useMemo(
    () => buildAlerts(clients, receivables, payables).length,
    [clients, receivables, payables],
  );

  async function onExport(): Promise<void> {
    const bundle = await exportBackup();
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `growfy-finance-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Backup exportado', { description: 'Arquivo baixado com sucesso.' });
  }

  function onImportClick(): void {
    fileInputRef.current?.click();
  }

  async function onImportFile(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const bundle: BackupBundle = JSON.parse(text);
      await importBackup(bundle);
      await useStore.getState().hydrate();
      toast('Backup restaurado', { description: 'Dados importados com sucesso.' });
    } catch (err) {
      toast('Falha ao importar', { description: (err as Error).message, tone: 'error' });
    } finally {
      event.target.value = '';
    }
  }

  async function onReset(): Promise<void> {
    if (window.confirm('Apagar todos os dados? Esta ação não pode ser desfeita.')) {
      await resetSeed();
      toast('Dados apagados', { description: 'Sistema limpo. Cadastre seus clientes para começar.', tone: 'info' });
    }
  }

  function openCommandPalette(): void {
    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true, bubbles: true });
    window.dispatchEvent(event);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-2xl">
      <div className="px-4 lg:px-6">
        <div className="flex items-center h-14 gap-3">
          {/* Brand */}
          <Logo />

          {/* Breadcrumb */}
          <div className="hidden md:flex items-center gap-2 pl-3 ml-1 border-l border-border/60 shrink-0">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Painel</span>
            <span className="text-muted-foreground/50">/</span>
            <motion.span
              key={active}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="text-[13px] font-medium"
            >
              {TAB_BREADCRUMB[active]}
            </motion.span>
          </div>

          {/* Search bar */}
          <button
            onClick={openCommandPalette}
            className="group hidden lg:flex items-center gap-2.5 h-9 min-w-0 flex-1 max-w-[360px] rounded-md border border-border/80 bg-card/40 px-3 hover:border-accent/40 hover:bg-card/70 transition-colors"
          >
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="text-[13px] text-muted-foreground/80 flex-1 min-w-0 text-left truncate whitespace-nowrap">
              Buscar leads, ações, atalhos
            </span>
            <kbd className="hidden xl:flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border bg-secondary/50 text-[10px] text-muted-foreground tabular shrink-0">
              <Command className="h-3 w-3" />K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            <PeriodSelector />

            <div className="hidden sm:block w-px h-5 bg-border/60 mx-1" />

            <div className="flex items-center gap-0.5">
              <button
                className="relative h-8 w-8 rounded-md hover:bg-secondary/60 transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
                title="Alertas"
              >
                <Bell className="h-4 w-4" />
                {alertCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[14px] h-[14px] rounded-full bg-destructive text-[9px] tabular text-white font-medium px-1">
                    {alertCount}
                  </span>
                )}
              </button>

              <Button variant="ghost" size="icon" onClick={onExport} title="Exportar backup" className="h-8 w-8">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onImportClick} title="Importar backup" className="h-8 w-8">
                <Upload className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={onImportFile}
              />
              <Button variant="ghost" size="icon" onClick={onReset} title="Resetar dados" className="h-8 w-8">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleTheme} title="Alternar tema" className="h-8 w-8">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>

            {/* Profile chip + menu */}
            <div className="relative ml-1" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 h-8 rounded-md border border-border/80 hover:border-accent/40 hover:bg-secondary/40 transition-colors"
              >
                <div className="h-5 w-5 rounded-full bg-gradient-azure flex items-center justify-center text-white text-[9px] font-semibold">
                  {initials}
                </div>
                <span className="text-[11px] font-medium hidden sm:inline truncate max-w-[100px]">{userLabel}</span>
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-[calc(100%+6px)] w-[240px] rounded-lg border border-border bg-popover/95 backdrop-blur-xl shadow-cinema overflow-hidden z-50"
                  >
                    <div className="p-3 border-b border-border/60">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Conta</p>
                      <p className="text-xs font-medium mt-1 truncate">{userEmail ?? 'agência@growfy.io'}</p>
                    </div>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        onSignOut?.();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary/60 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
                      Sair da conta
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
