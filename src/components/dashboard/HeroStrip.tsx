import { motion } from 'framer-motion';
import { Sparkline } from '@/components/shell/Sparkline';
import { ProgressRing } from '@/components/shell/ProgressRing';
import { Badge } from '@/components/ui/badge';
import { formatBRL, formatMonthLabel, formatPercent } from '@/lib/format';
import type { MonthSummary } from '@/lib/selectors';

interface HeroStripProps {
  selectedMonth: string;
  summary: MonthSummary;
  series: { month: string; revenue: number; expenses: number; profit: number }[];
}

export function HeroStrip({ selectedMonth, summary, series }: HeroStripProps) {
  const profitValues = series.map((s) => s.profit);
  const revenueValues = series.map((s) => s.revenue);
  const lastProfit = profitValues[profitValues.length - 1] ?? 0;
  const prevProfit = profitValues[profitValues.length - 2] ?? lastProfit;
  const profitDelta = prevProfit !== 0 ? ((lastProfit - prevProfit) / Math.abs(prevProfit)) * 100 : 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card p-6"
    >
      {/* Subtle accent corner */}
      <motion.div
        aria-hidden
        className="absolute -top-32 -right-32 h-64 w-64 rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, #5DD62C 0%, transparent 60%)' }}
        animate={{ opacity: [0.18, 0.3, 0.18] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative flex flex-col xl:flex-row gap-8">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Badge variant="success" className="uppercase tracking-widest text-[10px]">
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-accent"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              Painel Operacional
            </Badge>
            <span className="text-xs text-muted-foreground capitalize">{formatMonthLabel(selectedMonth)}</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-xs text-muted-foreground">Atualizado agora</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Lucro previsto</p>
              <p className="font-display text-display-md text-gradient-accent leading-none tabular">
                {formatBRL(summary.expectedProfit)}
              </p>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                Receita de <span className="text-foreground tabular">{formatBRL(summary.grossRevenue)}</span>
                {' '}menos despesas de <span className="text-foreground tabular">{formatBRL(summary.totalExpenses)}</span>.
                Tendência{' '}
                <span className={profitDelta >= 0 ? 'text-accent font-medium' : 'text-destructive font-medium'}>
                  {profitDelta >= 0 ? '+' : ''}{profitDelta.toFixed(1).replace('.', ',')}%
                </span>{' '}vs mês anterior.
              </p>
            </div>

            <div className="flex items-center justify-end">
              <ProgressRing
                value={Math.max(0, summary.marginPct)}
                max={Math.max(60, summary.marginPct + 10)}
                size={120}
                thickness={8}
                label="Margem"
                format={(n) => formatPercent(n, 0)}
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6 max-w-md">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Receita 6m</span>
                <span className="text-xs font-medium tabular">{formatBRL(revenueValues[revenueValues.length - 1] ?? 0)}</span>
              </div>
              <Sparkline values={revenueValues} color="#5DD62C" width={180} height={32} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Lucro 6m</span>
                <span className="text-xs font-medium tabular">{formatBRL(lastProfit)}</span>
              </div>
              <Sparkline values={profitValues} color="#5eaf73" width={180} height={32} />
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
