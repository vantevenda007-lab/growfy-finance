import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Client, ClientStatus, ContractType, PipelineStage } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { uid } from '@/lib/utils';

interface ClientFormProps {
  initial?: Client;
  defaultStage?: PipelineStage;
  onSubmit: (client: Client) => void;
  onCancel: () => void;
}

interface FormValues {
  company: string;
  contactName: string;
  phone: string;
  email: string;
  monthlyValue: number;
  estimatedValue: number;
  contractType: ContractType;
  contractStart: string;
  contractEnd: string;
  status: ClientStatus;
  pipelineStage: PipelineStage;
  source: string;
  priority: 'low' | 'medium' | 'high';
  notes: string;
}

export function ClientForm({ initial, defaultStage, onSubmit, onCancel }: ClientFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      company: initial?.company ?? '',
      contactName: initial?.contactName ?? '',
      phone: initial?.phone ?? '',
      email: initial?.email ?? '',
      monthlyValue: initial?.monthlyValue ?? 0,
      estimatedValue: initial?.estimatedValue ?? 0,
      contractType: initial?.contractType ?? 'fixed',
      contractStart: initial?.contractStart ?? new Date().toISOString().slice(0, 10),
      contractEnd: initial?.contractEnd ?? '',
      status: initial?.status ?? 'active',
      pipelineStage: initial?.pipelineStage ?? defaultStage ?? 'lead',
      source: initial?.source ?? '',
      priority: initial?.priority ?? 'medium',
      notes: initial?.notes ?? '',
    },
  });

  useEffect(() => {
    if (initial) {
      setValue('company', initial.company);
      setValue('contactName', initial.contactName);
      setValue('phone', initial.phone);
      setValue('email', initial.email);
      setValue('monthlyValue', initial.monthlyValue);
      setValue('estimatedValue', initial.estimatedValue ?? initial.monthlyValue);
      setValue('contractType', initial.contractType);
      setValue('contractStart', initial.contractStart);
      setValue('contractEnd', initial.contractEnd);
      setValue('status', initial.status);
      setValue('pipelineStage', initial.pipelineStage);
      setValue('source', initial.source ?? '');
      setValue('priority', initial.priority ?? 'medium');
      setValue('notes', initial.notes ?? '');
    }
  }, [initial, setValue]);

  const contractType = watch('contractType');
  const status = watch('status');
  const pipelineStage = watch('pipelineStage');
  const priority = watch('priority');

  function submit(values: FormValues): void {
    const client: Client = {
      id: initial?.id ?? uid('cli'),
      company: values.company.trim(),
      contactName: values.contactName.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      monthlyValue: Number(values.monthlyValue),
      estimatedValue: Number(values.estimatedValue) || Number(values.monthlyValue),
      contractType: values.contractType,
      contractStart: values.contractStart,
      contractEnd: values.contractEnd,
      status: values.status,
      pipelineStage: values.pipelineStage,
      source: values.source.trim() || undefined,
      priority: values.priority,
      notes: values.notes.trim() || undefined,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
    onSubmit(client);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <FieldRow>
          <Field label="Empresa" error={errors.company?.message}>
            <Input {...register('company', { required: 'Obrigatório' })} placeholder="Ex.: Helios Skincare" />
          </Field>
        </FieldRow>

        <FieldRow cols={2}>
          <Field label="Estágio do Pipeline">
            <Select value={pipelineStage} onValueChange={(v) => setValue('pipelineStage', v as PipelineStage)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="contact">Contato Inicial</SelectItem>
                <SelectItem value="proposal">Proposta Enviada</SelectItem>
                <SelectItem value="negotiation">Negociação</SelectItem>
                <SelectItem value="won">Cliente Ativo</SelectItem>
                <SelectItem value="lost">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Prioridade">
            <Select value={priority} onValueChange={(v) => setValue('priority', v as 'low' | 'medium' | 'high')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </FieldRow>

        <FieldRow cols={2}>
          <Field label="Responsável">
            <Input {...register('contactName')} placeholder="Nome do contato" />
          </Field>
          <Field label="Origem do lead">
            <Input {...register('source')} placeholder="Ex.: Indicação, Instagram..." />
          </Field>
        </FieldRow>

        <FieldRow cols={2}>
          <Field label="Telefone (WhatsApp)">
            <Input {...register('phone')} placeholder="11 90000-0000" />
          </Field>
          <Field label="E-mail" error={errors.email?.message}>
            <Input type="email" {...register('email')} placeholder="contato@empresa.com" />
          </Field>
        </FieldRow>

        <FieldRow cols={2}>
          <Field label="Valor potencial (R$)">
            <Input
              type="number"
              step="0.01"
              {...register('estimatedValue', { valueAsNumber: true, min: 0 })}
            />
          </Field>
          <Field label="Tipo de contrato">
            <Select value={contractType} onValueChange={(v) => setValue('contractType', v as ContractType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixo Mensal</SelectItem>
                <SelectItem value="project">Projeto Pontual</SelectItem>
                <SelectItem value="recurring-variable">Recorrente Variável</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </FieldRow>

        <FieldRow cols={2}>
          <Field label="Valor mensal contratado (R$)" error={errors.monthlyValue?.message}>
            <Input
              type="number"
              step="0.01"
              {...register('monthlyValue', { valueAsNumber: true, min: { value: 0, message: 'Não pode ser negativo' } })}
            />
          </Field>
          <Field label="Status">
            <Select value={status} onValueChange={(v) => setValue('status', v as ClientStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="paused">Pausado</SelectItem>
                <SelectItem value="churned">Churned</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </FieldRow>

        <FieldRow cols={2}>
          <Field label="Início do contrato">
            <Input type="date" {...register('contractStart')} />
          </Field>
          <Field label="Vencimento/Renovação">
            <Input type="date" {...register('contractEnd')} />
          </Field>
        </FieldRow>

        <Field label="Observações internas">
          <Textarea {...register('notes')} rows={4} placeholder="Histórico, particularidades do lead..." />
        </Field>
      </div>

      <div className="flex justify-end gap-2 p-4 border-t border-border bg-card/40">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="accent">
          {initial ? 'Salvar alterações' : 'Criar lead'}
        </Button>
      </div>
    </form>
  );
}

function FieldRow({ children, cols = 1 }: { children: React.ReactNode; cols?: 1 | 2 }) {
  return <div className={`grid gap-4 ${cols === 2 ? 'sm:grid-cols-2' : ''}`}>{children}</div>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
