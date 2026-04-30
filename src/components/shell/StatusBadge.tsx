import { Badge } from '@/components/ui/badge';
import type { ClientStatus, ExpenseStatus, PaymentStatus } from '@/types';

const RECEIVE_LABELS: Record<PaymentStatus, { label: string; variant: 'muted' | 'warning' | 'success' }> = {
  'pending': { label: 'Pendente', variant: 'muted' },
  'paid-by-client': { label: 'Pago pelo cliente', variant: 'warning' },
  'confirmed': { label: 'Confirmado', variant: 'success' },
};

const PAY_LABELS: Record<ExpenseStatus, { label: string; variant: 'muted' | 'warning' | 'success' }> = {
  'pending': { label: 'Pendente', variant: 'muted' },
  'paid': { label: 'Pago', variant: 'warning' },
  'confirmed': { label: 'Confirmado', variant: 'success' },
};

const CLIENT_LABELS: Record<ClientStatus, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  active: { label: 'Ativo', variant: 'success' },
  paused: { label: 'Pausado', variant: 'warning' },
  churned: { label: 'Churned', variant: 'danger' },
};

export function ReceiveStatusBadge({ status }: { status: PaymentStatus }) {
  const meta = RECEIVE_LABELS[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export function PayStatusBadge({ status }: { status: ExpenseStatus }) {
  const meta = PAY_LABELS[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const meta = CLIENT_LABELS[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
