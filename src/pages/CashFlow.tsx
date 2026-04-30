import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowDownRight, ArrowUpRight, Notebook } from 'lucide-react';
import { useStore } from '@/stores/useStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ChartTooltip } from '@/components/dashboard/ChartTooltip';
import { CHART_COLORS } from '@/lib/colors';
import { previousMonthKeys, formatBRL, formatBRLCompact, formatDate, formatMonthLabel, formatPercent } from '@/lib/format';
import { sixMonthSeries, summarizeMonth, timelineForMonth } from '@/lib/selectors';
import { cn } from '@/lib/utils';

export function CashFlow() {
  const {
    selectedMonth,
    receivables,
    payables,
    cashflowNotesByMonth,
    setCashflowNote,
  } = useStore();

  const summary = useMemo(
    () => summarizeMonth(selectedMonth, receivables, payables),
    [selectedMonth, receivables, payables],
  );

  const series = useMemo(
    () => sixMonthSeries(selectedMonth, receivables, payables).map((s) => ({
      ...s,
      label: shortMonth(s.month),
    })),
    [selectedMonth, receivables, payables],
  );

  const weeklyData = useMemo(() => buildWeeklyData(selectedMonth, receivables, payables), [selectedMonth, receivables, payables]);

  const timeline = useMemo(() => timelineForMonth(selectedMonth, receivables, payables), [selectedMonth, receivables, payables]);

  const note = cashflowNotesByMonth[selectedMonth] ?? '';

  const last3Months = useMemo(() => {
    const months = previousMonthKeys(3, selectedMonth);
    return months.map((m) => {
      const s = summarizeMonth(m, receivables, payables);
      return {
        month: m,
        revenue: s.grossRevenue,
        expenses: s.totalExpenses,
        profit: s.expectedProfit,
        margin: s.marginPct,
      };
    });
  }, [selectedMonth, receivables, payables]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-display-md tracking-tight">
          Fluxo de Caixa · <span className="text-gradient-accent capitalize">{formatMonthLabel(selectedMonth)}</span>
        </h1>
        <p className="text-muted-foreground">Visão consolidada e em tempo real cruzando entradas e saídas.</p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumo do mês</CardTitle>
            <CardDescription>Faturamento, despesas e lucro previsto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <RowItem label="Faturamento Recorrente" value={formatBRL(summary.recurringRevenue)} />
            <RowItem label="Faturamento Pontual / Variável" value={formatBRL(summary.variableRevenue)} />
            <Divider />
            <RowItem label="Faturamento Bruto" value={formatBRL(summary.grossRevenue)} bold />
            <Divider />
            <RowItem label="Despesas Fixas" value={formatBRL(summary.fixedExpenses)} />
            <RowItem label="Despesas Variáveis" value={formatBRL(summary.variableExpenses)} />
            <Divider />
            <RowItem label="Total de Despesas" value={formatBRL(summary.totalExpenses)} bold />
            <Divider />
            <RowItem
              label="Lucro Previsto"
              value={formatBRL(summary.expectedProfit)}
              bold
              accent={summary.expectedProfit >= 0 ? 'success' : 'danger'}
            />
            <RowItem label="Margem" value={formatPercent(summary.marginPct)} accent="muted" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Situação real</CardTitle>
            <CardDescription>Baseado nos status confirmados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <RowItem label="Já recebido" value={formatBRL(summary.receivedConfirmed)} accent="success" />
            <RowItem label="Ainda a receber" value={formatBRL(summary.toReceive)} accent="warning" />
            <Divider />
            <RowItem label="Já pago" value={formatBRL(summary.paidConfirmed)} accent="muted" />
            <RowItem label="Ainda a pagar" value={formatBRL(summary.toPay)} accent="muted" />
            <Divider />
            <RowItem
              label="Saldo disponível"
              value={formatBRL(summary.availableBalance)}
              bold
              accent={summary.availableBalance >= 0 ? 'success' : 'danger'}
            />
            <RowItem
              label="Saldo projetado fim do mês"
              value={formatBRL(summary.projectedClosingBalance)}
              bold
              accent={summary.projectedClosingBalance >= 0 ? 'success' : 'danger'}
            />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Movimentação semanal</CardTitle>
          <CardDescription>Entradas vs saídas por semana, com saldo acumulado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="cf-in" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.pulse} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={CHART_COLORS.forest} stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="cf-out" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.danger} stopOpacity={0.85} />
                    <stop offset="100%" stopColor={CHART_COLORS.danger} stopOpacity={0.45} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="var(--chart-grid)" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatBRLCompact(Number(v))} width={70} />
                <Tooltip content={<ChartTooltip valueFormatter={formatBRL} />} />
                <Bar dataKey="in" name="Entradas" stackId="a" fill="url(#cf-in)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="out" name="Saídas" stackId="b" fill="url(#cf-out)" radius={[6, 6, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  name="Saldo acumulado"
                  stroke={CHART_COLORS.mist}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: CHART_COLORS.mist }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Timeline do mês</CardTitle>
            <CardDescription>{timeline.length} evento(s) — entradas em verde, saídas em vermelho</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-y-auto max-h-[420px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card/90 backdrop-blur z-10">
                  <tr className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    <th className="text-left py-3 px-5 font-medium">Data</th>
                    <th className="text-left py-3 px-5 font-medium">Evento</th>
                    <th className="text-right py-3 px-5 font-medium">Valor</th>
                    <th className="text-left py-3 px-5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {timeline.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-10 text-muted-foreground">Sem eventos neste mês.</td></tr>
                  )}
                  {timeline.map((event, idx) => (
                    <motion.tr
                      key={`${event.date}-${idx}`}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.012 }}
                      className="border-t border-border hover:bg-secondary/20"
                    >
                      <td className="py-3 px-5 text-muted-foreground tabular">{formatDate(event.date, 'dd MMM')}</td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'rounded-md p-1.5 border',
                            event.kind === 'in'
                              ? 'bg-accent/10 border-accent/30 text-accent'
                              : 'bg-destructive/10 border-destructive/30 text-destructive',
                          )}>
                            {event.kind === 'in' ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                          </div>
                          <span>{event.label}</span>
                        </div>
                      </td>
                      <td className={cn(
                        'py-3 px-5 text-right tabular font-medium',
                        event.kind === 'in' ? 'text-accent' : 'text-destructive',
                      )}>
                        {event.kind === 'in' ? '+' : '−'} {formatBRL(event.amount)}
                      </td>
                      <td className="py-3 px-5">
                        <Badge variant="muted" className="capitalize">{statusLabel(event.status)}</Badge>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Notebook className="h-4 w-4 text-muted-foreground" /> Notas do mês
            </CardTitle>
            <CardDescription>Observações livres do gestor</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={10}
              placeholder="Observações sobre este mês: contexto, decisões, follow-ups..."
              value={note}
              onChange={(e) => void setCashflowNote(selectedMonth, e.target.value)}
              className="resize-none"
            />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Comparativo — últimos 3 meses</CardTitle>
          <CardDescription>Tendência de faturamento, despesas e lucro</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  <th className="text-left py-3 px-6 font-medium">Mês</th>
                  <th className="text-right py-3 px-6 font-medium">Faturamento</th>
                  <th className="text-right py-3 px-6 font-medium">Despesas</th>
                  <th className="text-right py-3 px-6 font-medium">Lucro</th>
                  <th className="text-right py-3 px-6 font-medium">Margem</th>
                </tr>
              </thead>
              <tbody>
                {last3Months.map((m, idx) => (
                  <motion.tr
                    key={m.month}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-t border-border"
                  >
                    <td className="py-3 px-6 capitalize font-medium">{formatMonthLabel(m.month)}</td>
                    <td className="py-3 px-6 text-right tabular">{formatBRL(m.revenue)}</td>
                    <td className="py-3 px-6 text-right tabular">{formatBRL(m.expenses)}</td>
                    <td className={cn('py-3 px-6 text-right tabular font-medium', m.profit >= 0 ? 'text-accent' : 'text-destructive')}>
                      {formatBRL(m.profit)}
                    </td>
                    <td className="py-3 px-6 text-right tabular">{formatPercent(m.margin)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <DefSeries data={series} />
    </div>
  );
}

function shortMonth(monthKey: string): string {
  const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const [y, m] = monthKey.split('-');
  return `${names[Number(m) - 1]}/${y.slice(2)}`;
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pendente',
    'paid-by-client': 'Pago p/ cliente',
    confirmed: 'Confirmado',
    paid: 'Pago',
  };
  return map[status] ?? status;
}

function buildWeeklyData(month: string, receivables: { competenceMonth: string; dueDate: string; amount: number }[], payables: { competenceMonth: string; dueDate: string; amount: number }[]): {
  week: string;
  in: number;
  out: number;
  cumulative: number;
}[] {
  const buckets: { in: number; out: number }[] = [
    { in: 0, out: 0 },
    { in: 0, out: 0 },
    { in: 0, out: 0 },
    { in: 0, out: 0 },
    { in: 0, out: 0 },
  ];
  function bucketIndex(dateIso: string): number {
    const day = Number(dateIso.split('-')[2]);
    if (day <= 7) return 0;
    if (day <= 14) return 1;
    if (day <= 21) return 2;
    if (day <= 28) return 3;
    return 4;
  }
  for (const r of receivables) {
    if (r.competenceMonth !== month) continue;
    buckets[bucketIndex(r.dueDate)].in += r.amount;
  }
  for (const p of payables) {
    if (p.competenceMonth !== month) continue;
    buckets[bucketIndex(p.dueDate)].out += p.amount;
  }
  let cumulative = 0;
  return buckets.map((b, idx) => {
    cumulative += b.in - b.out;
    return {
      week: `Sem. ${idx + 1}`,
      in: b.in,
      out: b.out,
      cumulative,
    };
  });
}

function RowItem({
  label,
  value,
  bold,
  accent,
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: 'success' | 'warning' | 'danger' | 'muted';
}) {
  const accentClass =
    accent === 'success' ? 'text-accent' :
    accent === 'warning' ? 'text-warning' :
    accent === 'danger' ? 'text-destructive' :
    accent === 'muted' ? 'text-muted-foreground' : '';
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={cn('text-muted-foreground', bold && 'text-foreground')}>{label}</span>
      <span className={cn('tabular', bold && 'font-semibold text-base', accentClass)}>{value}</span>
    </div>
  );
}

function Divider() {
  return <div className="hairline" />;
}

function DefSeries(_: { data: unknown }) {
  return null;
}
