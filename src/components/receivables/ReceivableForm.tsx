import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import type { PaymentStatus, ReceiveMethod, ReceiveType, Receivable } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/stores/useStore';
import { uid } from '@/lib/utils';
import { currentMonthKey, todayISO } from '@/lib/format';

interface ReceivableFormProps {
  initial?: Receivable;
  onSubmit: (r: Receivable) => void;
  onCancel: () => void;
  initialClientId?: string;
}

interface FormValues {
  clientId: string;
  description: string;
  type: ReceiveType;
  amount: number;
  competenceMonth: string;
  dueDate: string;
  receivedDate: string;
  status: PaymentStatus;
  method: ReceiveMethod;
  notes: string;
}

export function ReceivableForm({ initial, onSubmit, onCancel, initialClientId }: ReceivableFormProps) {
  const clients = useStore((s) => s.clients);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      clientId: initial?.clientId ?? initialClientId ?? '',
      description: initial?.description ?? '',
      type: initial?.type ?? 'fixed',
      amount: initial?.amount ?? 0,
      competenceMonth: initial?.competenceMonth ?? currentMonthKey(),
      dueDate: initial?.dueDate ?? todayISO(),
      receivedDate: initial?.receivedDate ?? '',
      status: initial?.status ?? 'pending',
      method: initial?.method ?? 'pix',
      notes: initial?.notes ?? '',
    },
  });

  const clientId = watch('clientId');
  const status = watch('status');
  const type = watch('type');
  const method = watch('method');

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === clientId),
    [clients, clientId],
  );

  useEffect(() => {
    // Pre-fill amount from contract value when client picked and amount is 0
    if (selectedClient && watch('amount') === 0) {
      setValue('amount', selectedClient.monthlyValue);
      if (!watch('description')) {
        setValue('description', `Mensalidade ${selectedClient.company}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient]);

  function submit(values: FormValues): void {
    const status = values.status;
    const receivedDate = status === 'confirmed' && !values.receivedDate
      ? todayISO()
      : values.receivedDate || undefined;
    const r: Receivable = {
      id: initial?.id ?? uid('rec'),
      clientId: values.clientId,
      description: values.description.trim(),
      type: values.type,
      amount: Number(values.amount),
      competenceMonth: values.competenceMonth,
      dueDate: values.dueDate,
      receivedDate,
      status,
      method: values.method,
      notes: values.notes.trim() || undefined,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
    onSubmit(r);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-1 min-h-0 flex-col">
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div>
          <Label>Cliente *</Label>
          <Select value={clientId} onValueChange={(v) => setValue('clientId', v)}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Selecionar cliente..." />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.clientId && <p className="text-xs text-destructive mt-1">Obrigatório</p>}
          {!clientId && <p className="text-xs text-muted-foreground mt-1.5">Cliente é obrigatório.</p>}
        </div>

        <div>
          <Label>Descrição</Label>
          <Input className="mt-1.5" {...register('description', { required: true })} placeholder="Ex.: Mensalidade Outubro" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setValue('type', v as ReceiveType)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixo Mensal</SelectItem>
                <SelectItem value="variable">Variável</SelectItem>
                <SelectItem value="one-time">Pontual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Valor (R$)</Label>
            <Input
              type="number"
              step="0.01"
              className="mt-1.5"
              {...register('amount', {
                valueAsNumber: true,
                min: { value: 0.01, message: 'Valor deve ser positivo' },
              })}
            />
            {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Mês de competência</Label>
            <Input type="month" className="mt-1.5" {...register('competenceMonth', { required: true })} />
          </div>
          <div>
            <Label>Vencimento</Label>
            <Input type="date" className="mt-1.5" {...register('dueDate', { required: true })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setValue('status', v as PaymentStatus)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid-by-client">Pago pelo cliente</SelectItem>
                <SelectItem value="confirmed">Confirmado na conta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Método</Label>
            <Select value={method} onValueChange={(v) => setValue('method', v as ReceiveMethod)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="ted">TED</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="card">Cartão</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {(status === 'paid-by-client' || status === 'confirmed') && (
          <div>
            <Label>Data de recebimento</Label>
            <Input type="date" className="mt-1.5" {...register('receivedDate')} />
          </div>
        )}

        <div>
          <Label>Observações</Label>
          <Textarea className="mt-1.5" rows={3} {...register('notes')} />
        </div>
      </div>

      <div className="flex justify-end gap-2 p-4 border-t border-border bg-card/40">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="accent" disabled={!clientId}>
          {initial ? 'Salvar' : 'Criar lançamento'}
        </Button>
      </div>
    </form>
  );
}
