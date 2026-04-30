import { useMemo } from 'react';
import { Mail, Phone, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClientStatusBadge, ReceiveStatusBadge } from '@/components/shell/StatusBadge';
import { useStore } from '@/stores/useStore';
import { clientHistory } from '@/lib/selectors';
import { formatBRL, formatDate, whatsappLink } from '@/lib/format';
import type { Client } from '@/types';

interface ClientDetailDrawerProps {
  clientId: string | null;
  onClose: () => void;
}

export function ClientDetailDrawer({ clientId, onClose }: ClientDetailDrawerProps) {
  const clients = useStore((s) => s.clients);
  const receivables = useStore((s) => s.receivables);

  const client = useMemo<Client | undefined>(
    () => clients.find((c) => c.id === clientId) ?? undefined,
    [clients, clientId],
  );

  const history = useMemo(
    () => (clientId ? clientHistory(clientId, receivables) : null),
    [clientId, receivables],
  );

  return (
    <Dialog open={Boolean(clientId)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        {client && history && (
          <div className="flex flex-col h-full">
            <DialogHeader>
              <div className="flex items-start gap-3">
                <div className="rounded-full h-10 w-10 bg-gradient-azure flex items-center justify-center text-white font-display text-base shrink-0">
                  {client.company.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <DialogTitle>{client.company}</DialogTitle>
                  <DialogDescription className="flex items-center gap-2 mt-1 flex-wrap">
                    <ClientStatusBadge status={client.status} />
                    <span>·</span>
                    <span>{client.contactName || 'Sem contato'}</span>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <section className="grid grid-cols-3 gap-4">
                <Stat label="Total recebido" value={formatBRL(history.totalReceived)} accent="success" />
                <Stat label="Em aberto" value={formatBRL(history.totalOpen)} />
                <Stat label="Ticket médio" value={formatBRL(history.averageTicket)} />
              </section>

              <section className="space-y-3">
                <h4 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Contato</h4>
                <div className="grid gap-2">
                  {client.phone && (
                    <Row icon={<Phone className="h-4 w-4" />}>
                      <span className="text-sm">{client.phone}</span>
                      <a
                        href={whatsappLink(client.phone)}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-auto inline-flex items-center gap-1 text-xs text-accent hover:underline"
                      >
                        <MessageCircle className="h-3 w-3" /> WhatsApp
                      </a>
                    </Row>
                  )}
                  {client.email && (
                    <Row icon={<Mail className="h-4 w-4" />}>
                      <a href={`mailto:${client.email}`} className="text-sm hover:underline">
                        {client.email}
                      </a>
                    </Row>
                  )}
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Contrato</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Pair label="Tipo" value={contractTypeLabel(client.contractType)} />
                  <Pair label="Valor mensal" value={formatBRL(client.monthlyValue)} />
                  <Pair label="Início" value={formatDate(client.contractStart)} />
                  <Pair label="Renovação" value={formatDate(client.contractEnd)} />
                </div>
                {client.notes && (
                  <p className="text-sm text-muted-foreground bg-secondary/30 border border-border rounded-md p-3 leading-relaxed">
                    {client.notes}
                  </p>
                )}
              </section>

              <section className="space-y-3">
                <h4 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Histórico de pagamentos ({history.rows.length})
                </h4>
                <ul className="rounded-lg border border-border divide-y divide-border overflow-hidden">
                  {history.rows.length === 0 && (
                    <li className="p-4 text-center text-sm text-muted-foreground">Sem lançamentos.</li>
                  )}
                  {history.rows.slice(0, 24).map((r) => (
                    <li key={r.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{r.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Venc. {formatDate(r.dueDate)} · {r.competenceMonth}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <ReceiveStatusBadge status={r.status} />
                        <span className="tabular font-medium">{formatBRL(r.amount)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: 'success' }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/20 p-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className={`font-display text-base mt-1 tabular ${accent === 'success' ? 'text-accent' : ''}`}>
        {value}
      </p>
    </div>
  );
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-secondary/20 px-3 py-2">
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </div>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="font-medium tabular mt-0.5">{value}</p>
    </div>
  );
}

function contractTypeLabel(type: Client['contractType']): string {
  return type === 'fixed' ? 'Fixo Mensal' : type === 'project' ? 'Projeto Pontual' : 'Recorrente Variável';
}

