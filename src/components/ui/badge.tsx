import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tabular',
  {
    variants: {
      variant: {
        default: 'border-border bg-secondary text-secondary-foreground',
        success: 'border-accent/30 bg-accent/15 text-accent',
        warning: 'border-warning/30 bg-warning/15 text-warning',
        danger: 'border-destructive/30 bg-destructive/15 text-destructive',
        info: 'border-cosmos-azure/40 bg-cosmos-azure/15 text-blue-200',
        muted: 'border-border bg-muted/40 text-muted-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
