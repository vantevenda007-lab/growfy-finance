import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/stores/useStore';
import { uid } from '@/lib/utils';
import type { CalendarEvent, CalendarEventType, CalendarEventPriority } from '@/types';

interface EventFormProps {
  initial?: CalendarEvent;
  defaultDate: string;
  onSubmit: (event: CalendarEvent) => void;
  onCancel: () => void;
}

interface FormValues {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  type: CalendarEventType;
  priority: CalendarEventPriority;
  location: string;
  clientId: string;
}

export function EventForm({ initial, defaultDate, onSubmit, onCancel }: EventFormProps) {
  const clients = useStore((s) => s.clients);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      title: initial?.title ?? '',
      description: initial?.description ?? '',
      date: initial?.date ?? defaultDate,
      startTime: initial?.startTime ?? '09:00',
      endTime: initial?.endTime ?? '10:00',
      allDay: initial?.allDay ?? false,
      type: initial?.type ?? 'meeting',
      priority: initial?.priority ?? 'medium',
      location: initial?.location ?? '',
      clientId: initial?.clientId ?? '',
    },
  });

  useEffect(() => {
    if (initial) {
      setValue('title', initial.title);
      setValue('description', initial.description ?? '');
      setValue('date', initial.date);
      setValue('startTime', initial.startTime ?? '09:00');
      setValue('endTime', initial.endTime ?? '10:00');
      setValue('allDay', initial.allDay);
      setValue('type', initial.type);
      setValue('priority', initial.priority);
      setValue('location', initial.location ?? '');
      setValue('clientId', initial.clientId ?? '');
    }
  }, [initial, setValue]);

  const allDay = watch('allDay');
  const type = watch('type');
  const priority = watch('priority');
  const clientId = watch('clientId');

  function submit(values: FormValues): void {
    const event: CalendarEvent = {
      id: initial?.id ?? uid('evt'),
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      date: values.date,
      allDay: values.allDay,
      startTime: values.allDay ? undefined : values.startTime || undefined,
      endTime: values.allDay ? undefined : values.endTime || undefined,
      type: values.type,
      priority: values.priority,
      location: values.location.trim() || undefined,
      clientId: values.clientId || undefined,
      completed: initial?.completed ?? false,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
    onSubmit(event);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-1 min-h-0 flex-col">
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div>
          <Label>Título *</Label>
          <Input
            {...register('title', { required: 'Obrigatório' })}
            placeholder="Ex.: Reunião com Acme Studios"
            autoFocus
          />
          {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setValue('type', v as CalendarEventType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">Reunião</SelectItem>
                <SelectItem value="task">Tarefa</SelectItem>
                <SelectItem value="reminder">Lembrete</SelectItem>
                <SelectItem value="deadline">Prazo</SelectItem>
                <SelectItem value="milestone">Marco</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Prioridade</Label>
            <Select
              value={priority}
              onValueChange={(v) => setValue('priority', v as CalendarEventPriority)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Data</Label>
          <Input type="date" {...register('date', { required: true })} />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="allday"
            type="checkbox"
            {...register('allDay')}
            className="h-4 w-4 rounded border-border accent-accent"
          />
          <Label htmlFor="allday" className="cursor-pointer text-[13px]">
            Dia todo
          </Label>
        </div>

        {!allDay && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Início</Label>
              <Input type="time" {...register('startTime')} />
            </div>
            <div>
              <Label>Término</Label>
              <Input type="time" {...register('endTime')} />
            </div>
          </div>
        )}

        <div>
          <Label>Local</Label>
          <Input {...register('location')} placeholder="Ex.: Google Meet, Escritório, Cliente" />
        </div>

        <div>
          <Label>Cliente vinculado</Label>
          <Select value={clientId || 'none'} onValueChange={(v) => setValue('clientId', v === 'none' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Nenhum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Notas</Label>
          <Textarea
            {...register('description')}
            rows={3}
            placeholder="Pauta, contexto, links..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 p-4 border-t border-border bg-card/40">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="accent">
          {initial ? 'Salvar alterações' : 'Criar compromisso'}
        </Button>
      </div>
    </form>
  );
}
