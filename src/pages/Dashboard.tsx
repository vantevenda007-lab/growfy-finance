import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  DollarSign,
  Percent,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useStore } from '@/stores/useStore';
import {
  buildAlerts,
  expenseCategoryBreakdown,
  sixMonthSeries,
  summarizeMonth,
} from '@/lib/selectors';
import { formatBRL, formatBRLCompact, formatMonthLabel, formatPercent } from '@/lib/format';
import { CATEGORY_COLORS, CATEGORY_LABELS, CHART_COLORS } from '@/lib/colors';
import { KpiCard } from '@/components/shell/KpiCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartTooltip } from '@/components/dashboard/ChartTooltip';
import { HeroStrip } from '@/components/dashboard/HeroStrip';

export function Dashboard() {
  const { selectedMonth, clients, receivables, payables } = useStore();

  const summary = useMemo(
    () => summarizeMonth(selectedMonth, receivables, payables),
    [selectedMonth, receivables, payables],
  );
  const previousSummary = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prev = new Date(y, m - 2, 1);
    const key = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    return summarizeMonth(key, receivables, payables);
  }, [selectedMonth, receivables, payables]);

  const series = useMemo(
    () => sixMonthSeries(selectedMonth, receivables, payables),
    [selectedMonth, receivables, payables],
  );
  const profitSeries = useMemo(
    () => series.map((s) => ({ ...s, label: shortMonth(s.month) })),
    [series],
  );

  const breakdown = useMemo(
    () => expenseCategoryBreakdown(selectedMonth, payables),
    [selectedMonth, payables],
  );

  const alerts = useMemo(
    () => buildAlerts(clients, receivables, payables).slice(0, 8),
    [clients, receivables, payables],
  );

  const profitDelta = previousSummary.expectedProfit !== 0
    ? ((summary.expectedProfit - previousSummary.expectedProfit) / Math.abs(previousSummary.expectedProfit)) * 100
    : 0;
  const revenueDelta = previousSummary.grossRevenue !== 0
    ? ((summary.grossRevenue - previousSummary.grossRevenue) / previousSummary.grossRevenue) * 100
    : 0;
  const expensesDelta = previousSummary.totalExpenses !== 0
    ? ((summary.totalExpenses - previousSummary.totalExpenses) / previousSummary.totalExpenses) * 100
    : 0;

  return (
    <div className="space-y-8">
      <HeroStrip selectedMonth={selectedMonth} summary={summary} series={series} />

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Faturamento Bruto"
          value={summary.grossRevenue}
          format={formatBRL}
          delta={revenueDelta}
          deltaLabel="vs mês ant."
          icon={DollarSign}
          tone="accent"
          index={0}
          spark={series.map((s) => s.revenue)}
        />
        <KpiCard
          label="Despesas"
          value={summary.totalExpenses}
          format={formatBRL}
          delta={expensesDelta}
          deltaLabel="vs mês ant."
          icon={TrendingDown}
          tone="danger"
          index={1}
          spark={series.map((s) => s.expenses)}
        />
        <KpiCard
          label="Lucro Previsto"
          value={summary.expectedProfit}
          format={formatBRL}
          delta={profitDelta}
          deltaLabel="vs mês ant."
          icon={TrendingUp}
          tone="success"
          index={2}
          spark={series.map((s) => s.profit)}
        />
        <KpiCard
          label="Margem de Lucro"
          value={summary.marginPct}
          format={(n) => formatPercent(n)}
          icon={Percent}
          tone="default"
          index={3}
          spark={series.map((s) => (s.revenue > 0 ? (s.profit / s.revenue) * 100 : 0))}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Receita vs Despesas</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barCategoryGap="22%">
                  <defs>
                    <linearGradient id="grad-revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.pulse} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={CHART_COLORS.forest} stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="grad-expenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.danger} stopOpacity={0.85} />
                      <stop offset="100%" stopColor={CHART_COLORS.danger} stopOpacity={0.45} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke="var(--chart-grid)" />
                  <XAxis
                    dataKey="label"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatBRLCompact(Number(v))}
                    width={70}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--accent) / 0.06)' }}
                    content={<ChartTooltip />}
                  />
                  <Bar dataKey="revenue" name="Receita" fill="url(#grad-revenue)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expenses" name="Despesas" fill="url(#grad-expenses)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Composição de Despesas</CardTitle>
            <CardDescription>Por categoria — {formatMonthLabel(selectedMonth)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] flex items-center justify-center">
              {breakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem despesas neste mês.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={breakdown}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={92}
                      paddingAngle={3}
                      cornerRadius={6}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    >
                      {breakdown.map((entry, idx) => (
                        <Cell
                          key={entry.category}
                          fill={CATEGORY_COLORS[entry.category] ?? `hsl(${idx * 60}, 60%, 50%)`}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip valueFormatter={formatBRL} categoryLabels={CATEGORY_LABELS} />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {breakdown.slice(0, 6).map((entry) => (
                <div key={entry.category} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: CATEGORY_COLORS[entry.category] ?? '#94a3b8' }}
                  />
                  <span className="truncate text-muted-foreground">
                    {CATEGORY_LABELS[entry.category] ?? entry.category}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Evolução do Lucro</CardTitle>
            <CardDescription>Trajetória dos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={profitSeries} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grad-line" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={CHART_COLORS.mist} />
                      <stop offset="100%" stopColor={CHART_COLORS.pulse} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke="var(--chart-grid)" />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatBRLCompact(Number(v))} width={70} />
                  <Tooltip content={<ChartTooltip valueFormatter={formatBRL} />} />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="url(#grad-line)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: CHART_COLORS.pulse, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: CHART_COLORS.pulse, stroke: 'white', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-warning" />
              Alertas inteligentes
            </CardTitle>
            <CardDescription>Próximos 7 dias e pendências</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border max-h-[300px] overflow-y-auto">
              {alerts.length === 0 && (
                <li className="px-6 py-8 text-center text-sm text-muted-foreground">
                  Tudo sob controle.
                </li>
              )}
              {alerts.map((alert, idx) => (
                <motion.li
                  key={alert.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex items-start gap-3 px-6 py-3 text-sm"
                >
                  <AlertIcon kind={alert.kind} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{alert.label}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      {alert.amount && <span className="tabular">{formatBRL(alert.amount)}</span>}
                      <span>·</span>
                      <span>{relativeDayLabel(alert.daysUntil)}</span>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function shortMonth(monthKey: string): string {
  const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const [y, m] = monthKey.split('-');
  return `${names[Number(m) - 1]}/${y.slice(2)}`;
}

function relativeDayLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)} dia${Math.abs(days) === 1 ? '' : 's'} em atraso`;
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Amanhã';
  return `Em ${days} dias`;
}

function AlertIcon({ kind }: { kind: 'receive-due' | 'pay-due' | 'overdue' | 'contract-renewal' }) {
  if (kind === 'overdue') {
    return (
      <div className="rounded-md p-1.5 bg-destructive/15 border border-destructive/30 text-destructive">
        <AlertTriangle className="h-3.5 w-3.5" />
      </div>
    );
  }
  if (kind === 'contract-renewal') {
    return (
      <div className="rounded-md p-1.5 bg-warning/15 border border-warning/30 text-warning">
        <CalendarClock className="h-3.5 w-3.5" />
      </div>
    );
  }
  if (kind === 'receive-due') {
    return (
      <div className="rounded-md p-1.5 bg-accent/15 border border-accent/30 text-accent">
        <TrendingUp className="h-3.5 w-3.5" />
      </div>
    );
  }
  return (
    <div className="rounded-md p-1.5 bg-cosmos-azure/15 border border-cosmos-azure/40 text-blue-200">
      <TrendingDown className="h-3.5 w-3.5" />
    </div>
  );
}
