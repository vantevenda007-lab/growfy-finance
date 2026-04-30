import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { AnimatedNumber } from './AnimatedNumber';
import { Sparkline } from './Sparkline';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: number;
  format: (n: number) => string;
  delta?: number;
  deltaLabel?: string;
  icon?: LucideIcon;
  tone?: 'default' | 'success' | 'danger' | 'accent';
  index?: number;
  spark?: number[];
}

const dotByTone: Record<NonNullable<KpiCardProps['tone']>, string> = {
  default: 'bg-muted-foreground',
  success: 'bg-accent',
  danger: 'bg-destructive',
  accent: 'bg-cosmos-azure',
};

const sparkColorByTone: Record<NonNullable<KpiCardProps['tone']>, string> = {
  default: '#5eaf73',
  success: '#5DD62C',
  danger: '#E74C3C',
  accent: '#5DD62C',
};

export function KpiCard({
  label,
  value,
  format,
  delta,
  deltaLabel,
  icon: Icon,
  tone = 'default',
  index = 0,
  spark,
}: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border/80 bg-card p-5',
        'transition-all duration-300 ease-out hover:border-border',
      )}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className={cn('h-1.5 w-1.5 rounded-full', dotByTone[tone])} />
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </span>
        </div>
        {Icon && (
          <Icon className="h-3.5 w-3.5 text-muted-foreground/60" />
        )}
      </div>
      <div className="font-display tabular text-[28px] tracking-tight leading-none">
        <AnimatedNumber value={value} format={format} />
      </div>
      <div className="flex items-end justify-between mt-3">
        {typeof delta === 'number' ? (
          <div className="flex items-center gap-1 text-xs">
            {delta >= 0 ? (
              <ArrowUpRight className="h-3 w-3 text-accent" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-destructive" />
            )}
            <span className={cn('tabular font-medium', delta >= 0 ? 'text-accent' : 'text-destructive')}>
              {delta >= 0 ? '+' : ''}
              {delta.toFixed(1).replace('.', ',')}%
            </span>
            {deltaLabel && <span className="text-muted-foreground text-[11px]">{deltaLabel}</span>}
          </div>
        ) : (
          <div />
        )}
        {spark && spark.length > 0 && (
          <div className="opacity-70 group-hover:opacity-100 transition-opacity">
            <Sparkline values={spark} color={sparkColorByTone[tone]} width={70} height={22} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
