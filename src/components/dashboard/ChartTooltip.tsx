import type { TooltipProps } from 'recharts';
import { formatBRL } from '@/lib/format';

interface CustomTooltipProps extends TooltipProps<number, string> {
  valueFormatter?: (value: number) => string;
  categoryLabels?: Record<string, string>;
}

export function ChartTooltip({ active, payload, label, valueFormatter, categoryLabels }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const fmt = valueFormatter ?? formatBRL;

  return (
    <div className="rounded-lg border border-border glass-elevated p-3 min-w-[160px] shadow-cinema">
      {label && (
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">{label}</p>
      )}
      <ul className="space-y-1.5">
        {payload.map((entry) => {
          const key = String(entry.dataKey ?? entry.name ?? '');
          const displayLabel = categoryLabels?.[String(entry.payload?.category ?? key)]
            ?? entry.name
            ?? key;
          return (
            <li key={key} className="flex items-center justify-between gap-4 text-xs">
              <span className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: entry.color ?? entry.fill }}
                />
                <span className="text-muted-foreground">{displayLabel}</span>
              </span>
              <span className="tabular font-medium">{fmt(Number(entry.value))}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
