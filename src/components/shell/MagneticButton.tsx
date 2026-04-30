import { forwardRef, useRef, type MouseEvent as ReactMouseEvent } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  intensity?: number;
}

export const MagneticButton = forwardRef<HTMLButtonElement, MagneticButtonProps>(
  ({ children, className, intensity = 0.35, ...props }, forwardedRef) => {
    const internalRef = useRef<HTMLButtonElement>(null);
    const ref = (forwardedRef ?? internalRef) as React.RefObject<HTMLButtonElement>;

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const sx = useSpring(x, { stiffness: 220, damping: 18 });
    const sy = useSpring(y, { stiffness: 220, damping: 18 });
    const tx = useTransform(sx, (v) => v);
    const ty = useTransform(sy, (v) => v);

    function onMouseMove(event: ReactMouseEvent<HTMLButtonElement>): void {
      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      x.set(dx * intensity);
      y.set(dy * intensity);
    }

    function onMouseLeave(): void {
      x.set(0);
      y.set(0);
    }

    return (
      <motion.button
        ref={ref}
        style={{ x: tx, y: ty }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 rounded-md px-5 h-11 font-semibold text-sm',
          'bg-gradient-pulse text-data-ink shadow-glow transition-shadow duration-300',
          'hover:shadow-glow-lg focus-ring',
          className,
        )}
        {...(props as object)}
      >
        {children}
      </motion.button>
    );
  },
);

MagneticButton.displayName = 'MagneticButton';
