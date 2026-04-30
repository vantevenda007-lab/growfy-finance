import { Bell, BellOff, BellRing, Command, Download, LogOut, Moon, RotateCcw, Search, Sun, Upload } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  detectPlatform,
  fireTestNotification,
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationPermissionState,
} from '@/lib/notifications';
import { useEventBanner } from './EventBanner';
import { Logo } from './Logo';
import { PeriodSelector } from './PeriodSelector';
import { Button } from '@/components/ui/button';
import { useStore } from '@/stores/useStore';
import { exportBackup, importBackup, type BackupBundle } from '@/lib/db';
import { toast } from './Toaster';
import { buildAlerts } from '@/lib/selectors';
import { cn } from '@/lib/utils';
import type { TabKey } from './SidebarNav';

const TAB_BREADCRUMB: Record<TabKey, string> = {
  dashboard: 'Dashboard',
  crm: 'CRM · Pipeline',
  calendar: 'Agenda',
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
  const [permission, setPermission] = useState<NotificationPermissionState>(() =>
    getNotificationPermission(),
  );
  const platform = useMemo(() => detectPlatform(), []);

  async function onToggleNotifications(): Promise<void> {
    if (permission === 'unsupported') {
      toast('Sem suporte', {
        description: 'Este navegador não suporta notificações.',
        tone: 'warning',
      });
      return;
    }
    if (permission === 'granted') {
      toast('Notificações ativas', {
        description: 'Para desativar, gerencie pelo cadeado da barra do navegador.',
        tone: 'info',
      });
      return;
    }
    if (permission === 'denied') {
      toast('Bloqueado pelo navegador', {
        description: 'Permita pelo cadeado da barra para receber lembretes.',
        tone: 'warning',
      });
      return;
    }
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      toast('Notificações ativadas', {
        description: 'Você será avisado das reuniões.',
        tone: 'success',
      });
    }
  }

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
                onClick={onToggleNotifications}
                className="relative h-8 w-8 rounded-md hover:bg-secondary/60 transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
                title={
                  permission === 'granted'
                    ? `Notificações ativas · ${alertCount} alerta${alertCount === 1 ? '' : 's'}`
                    : permission === 'denied'
                    ? 'Notificações bloqueadas'
                    : permission === 'unsupported'
                    ? 'Notificações sem suporte neste navegador'
                    : 'Ativar notificações'
                }
              >
                {permission === 'denied' || permission === 'unsupported' ? (
                  <BellOff className="h-4 w-4" />
                ) : (
                  <Bell className={cn('h-4 w-4', permission === 'granted' && 'text-accent')} />
                )}
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

                    <div className="p-3 border-b border-border/60 space-y-2">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Notificações
                      </p>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Status</span>
                        <span
                          className={cn(
                            'tabular',
                            permission === 'granted' && 'text-accent',
                            permission === 'denied' && 'text-destructive',
                            permission === 'unsupported' && 'text-muted-foreground',
                            permission === 'default' && 'text-warning',
                          )}
                        >
                          {permission === 'granted' && 'Ativadas'}
                          {permission === 'denied' && 'Bloqueadas'}
                          {permission === 'default' && 'Não pedido'}
                          {permission === 'unsupported' && 'Sem suporte'}
                        </span>
                      </div>
                      {permission === 'granted' && (
                        <button
                          onClick={() => {
                            const result = fireTestNotification();
                            // Always show in-app banner as guaranteed feedback,
                            // since the OS may block native notifications silently.
                            const eventAt = new Date(Date.now() + 5 * 60_000).toISOString();
                            useEventBanner.getState().push({
                              title: 'Reunião de demonstração',
                              body: result.delivered
                                ? 'Banner interno + notificação nativa enviados.'
                                : 'Banner interno OK · ' + (result.reason ?? ''),
                              eventAt,
                              tone: 'meeting',
                              priority: 'high',
                              location: 'Google Meet',
                              client: 'Acme Studios',
                            });
                            toast('Teste disparado', {
                              description: result.delivered
                                ? 'Veja o banner à direita. Se a notificação do navegador não chegou, verifique System Settings → Notifications → Chrome.'
                                : (result.reason ?? 'Banner interno disparado mesmo sem nativa.'),
                              tone: result.delivered ? 'success' : 'info',
                            });
                            setProfileOpen(false);
                          }}
                          className="flex w-full items-center gap-2 px-2 py-1.5 -mx-1 rounded text-[11px] hover:bg-secondary/60 transition-colors"
                        >
                          <BellRing className="h-3 w-3 text-accent" />
                          Testar notificação
                        </button>
                      )}
                      {permission === 'default' && (
                        <button
                          onClick={async () => {
                            const result = await requestNotificationPermission();
                            setPermission(result);
                            if (result === 'granted') {
                              toast('Notificações ativadas', {
                                description: 'Você será avisado das reuniões.',
                                tone: 'success',
                              });
                              fireTestNotification();
                            }
                          }}
                          className="flex w-full items-center gap-2 px-2 py-1.5 -mx-1 rounded text-[11px] hover:bg-secondary/60 transition-colors"
                        >
                          <Bell className="h-3 w-3 text-muted-foreground" />
                          Ativar notificações
                        </button>
                      )}
                      {permission === 'denied' && (
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          Bloqueado pelo navegador. Clique no cadeado da barra → Notificações → Permitir → recarregue a página.
                        </p>
                      )}

                      {/* Mobile-specific guidance */}
                      {platform.isIOS && !platform.isStandalone && (
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          <strong className="text-foreground">iPhone/iPad:</strong> Safari mobile não permite notificações em abas comuns.
                          Tap no botão <strong className="text-foreground">Compartilhar</strong> →
                          <strong className="text-foreground"> Adicionar à Tela de Início</strong> e abra pelo ícone.
                        </p>
                      )}
                      {platform.isStandalone && permission === 'default' && (
                        <p className="text-[10px] text-accent leading-relaxed">
                          ✓ App instalado · ative as notificações tocando no botão acima.
                        </p>
                      )}
                      {platform.isAndroid && permission === 'denied' && (
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          <strong className="text-foreground">Android:</strong> abra Configurações do site no menu do Chrome → Notificações → Permitir.
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground/70 leading-relaxed pt-1 border-t border-border/40">
                        {platform.isMobile
                          ? 'Mesmo sem nativas, o banner interno toca som + vibra enquanto o app está aberto.'
                          : 'Banner interno funciona como fallback se as nativas falharem.'}
                      </p>
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
