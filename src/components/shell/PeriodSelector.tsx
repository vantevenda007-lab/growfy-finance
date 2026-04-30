import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '@/stores/useStore';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatMonthLabel, previousMonthKeys } from '@/lib/format';
import type { PeriodGrain } from '@/types';

const GRAINS: { value: PeriodGrain; label: string }[] = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'year', label: 'Ano' },
];

export function PeriodSelector() {
  const selectedMonth = useStore((s) => s.selectedMonth);
  const setSelectedMonth = useStore((s) => s.setSelectedMonth);
  const periodGrain = useStore((s) => s.periodGrain);
  const setPeriodGrain = useStore((s) => s.setPeriodGrain);

  const monthOptions = previousMonthKeys(18, addMonthsKey(selectedMonth, 6));

  function shiftMonth(delta: number): void {
    setSelectedMonth(addMonthsKey(selectedMonth, delta));
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="hidden xl:flex items-center rounded-md border border-border bg-card/40 p-0.5 relative">
        {GRAINS.map((g) => {
          const active = g.value === periodGrain;
          return (
            <button
              key={g.value}
              onClick={() => setPeriodGrain(g.value)}
              className={cn(
                'relative px-2.5 py-1 text-[11px] font-medium transition-colors rounded',
                active ? 'text-data-ink' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {active && (
                <motion.div
                  layoutId="period-grain-active"
                  className="absolute inset-0 bg-gradient-pulse rounded"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span className="relative z-10">{g.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center rounded-md border border-border bg-card/40">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => shiftMonth(-1)}
          className="h-8 w-7 rounded-l-md rounded-r-none"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="h-8 min-w-[140px] border-0 bg-transparent capitalize tabular text-[12px] focus:shadow-none">
            <SelectValue placeholder={formatMonthLabel(selectedMonth)} />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((m) => (
              <SelectItem key={m} value={m} className="capitalize">
                {formatMonthLabel(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => shiftMonth(1)}
          className="h-8 w-7 rounded-r-md rounded-l-none"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function addMonthsKey(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
