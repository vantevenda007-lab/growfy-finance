import { useForm } from 'react-hook-form';
import type { ExpenseCategory, ExpenseFlavor, ExpenseStatus, PayMethod, Payable } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/stores/useStore';
import { uid } from '@/lib/utils';
import { CATEGORY_LABELS } from '@/lib/colors';
import { currentMonthKey, todayISO } from '@/lib/format';

interface PayableFormProps {
  initial?: Payable;
  onSubmit: (p: Payable) => void;
  onCancel: () => void;
}

interface FormValues {
  description: string;
  category: ExpenseCategory;
  customCategory: string;
  flavor: ExpenseFlavor;
  amount: number;
  competenceMonth: string;
  dueDate: string;
  paidDate: string;
  status: ExpenseStatus;
  vendor: string;
  method: PayMethod;
  recurring: boolean;
  linkedClientId: string;
  notes: string;
}

const STANDARD_CATEGORIES: { value: ExpenseCategory; label: string }[] = (Object.keys(CATEGORY_LABELS) as ExpenseCategory[])
  .map((value) => ({ value, label: CATEGORY_LABELS[value] }));

export function PayableForm({ initial, onSubmit, onCancel }: PayableFormProps) {
  const clients = useStore((s) => s.clients);
  const customCategories = useStore((s) => s.customExpenseCategories);
  const addCustomCategory = useStore((s) => s.addCustomCategory);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      description: initial?.description ?? '',
      category: initial?.category ?? 'employee',
      customCategory: initial?.customCategory ?? '',
      flavor: initial?.flavor ?? 'fixed',
      amount: initial?.amount ?? 0,
      competenceMonth: initial?.competenceMonth ?? currentMonthKey(),
      dueDate: initial?.dueDate ?? todayISO(),
      paidDate: initial?.paidDate ?? '',
      status: initial?.status ?? 'pending',
      vendor: initial?.vendor ?? '',
      method: initial?.method ?? 'pix',
      recurring: initial?.recurring ?? false,
      linkedClientId: initial?.linkedClientId ?? '',
      notes: initial?.notes ?? '',
    },
  });

  const status = watch('status');
  const category = watch('category');
  const flavor = watch('flavor');
  const method = watch('method');
  const recurring = watch('recurring');
  const linkedClientId = watch('linkedClientId');

  function submit(values: FormValues): void {
    let finalCategory: ExpenseCategory = values.category;
    let custom = values.customCategory.trim() || undefined;

    if (custom && !STANDARD_CATEGORIES.some((c) => c.label.toLowerCase() === custom!.toLowerCase())) {
      void addCustomCategory(custom);
      finalCategory = 'other';
    }

    const paidDate = (values.status === 'confirmed' || values.status === 'paid') && !values.paidDate
      ? todayISO()
      : values.paidDate || undefined;

    const p: Payable = {
      id: initial?.id ?? uid('pay'),
      description: values.description.trim(),
      category: finalCategory,
      customCategory: custom,
      flavor: values.flavor,
      amount: Number(values.amount),
      competenceMonth: values.competenceMonth,
      dueDate: values.dueDate,
      paidDate,
      status: values.status,
      vendor: values.vendor.trim(),
      method: values.method,
      recurring: values.recurring,
      linkedClientId: values.linkedClientId || undefined,
      notes: values.notes.trim() || undefined,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
    onSubmit(p);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-1 min-h-0 flex-col">
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div>
          <Label>Descrição</Label>
          <Input className="mt-1.5" {...register('description', { required: true })} placeholder="Ex.: Salário Designer" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Fornecedor / Beneficiário</Label>
            <Input className="mt-1.5" {...register('vendor')} placeholder="Quem recebe" />
          </div>
          <div>
            <Label>Valor (R$)</Label>
            <Input
              type="number"
              step="0.01"
              className="mt-1.5"
              {...register('amount', { valueAsNumber: true, min: { value: 0.01, message: 'Valor deve ser positivo' } })}
            />
            {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Categoria</Label>
            <Select value={category} onValueChange={(v) => setValue('category', v as ExpenseCategory)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STANDARD_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
                {customCategories.map((label) => (
                  <SelectItem key={`custom-${label}`} value="other">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {category === 'other' && (
              <Input
                className="mt-2"
                placeholder="Categoria personalizada..."
                {...register('customCategory')}
              />
            )}
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={flavor} onValueChange={(v) => setValue('flavor', v as ExpenseFlavor)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixo</SelectItem>
                <SelectItem value="variable">Variável</SelectItem>
              </SelectContent>
            </Select>
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
            <Select value={status} onValueChange={(v) => setValue('status', v as ExpenseStatus)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="confirmed">Confirmado no extrato</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Método</Label>
            <Select value={method} onValueChange={(v) => setValue('method', v as PayMethod)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="ted">TED</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="card">Cartão</SelectItem>
                <SelectItem value="debit">Débito automático</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {(status === 'paid' || status === 'confirmed') && (
          <div>
            <Label>Data de pagamento</Label>
            <Input type="date" className="mt-1.5" {...register('paidDate')} />
          </div>
        )}

        <div className="flex items-center justify-between rounded-md border border-border bg-secondary/20 px-4 py-3">
          <div>
            <Label className="!text-foreground !text-sm !normal-case !tracking-normal">Despesa recorrente</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Marque para gerar automaticamente em meses futuros.</p>
          </div>
          <Switch checked={recurring} onCheckedChange={(v) => setValue('recurring', v)} />
        </div>

        <div>
          <Label>Cliente relacionado (opcional)</Label>
          <Select value={linkedClientId || 'none'} onValueChange={(v) => setValue('linkedClientId', v === 'none' ? '' : v)}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Nenhum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.company}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1.5">Vincule a um cliente para análise de margem.</p>
        </div>

        <div>
          <Label>Observações</Label>
          <Textarea className="mt-1.5" rows={3} {...register('notes')} />
        </div>
      </div>

      <div className="flex justify-end gap-2 p-4 border-t border-border bg-card/40">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="accent">
          {initial ? 'Salvar' : 'Criar despesa'}
        </Button>
      </div>
    </form>
  );
}
