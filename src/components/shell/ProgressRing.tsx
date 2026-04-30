import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  thickness?: number;
  label?: string;
  format?: (n: number) => string;
}

export function ProgressRing({
  value,
  max = 100,
  size = 120,
  thickness = 8,
  label,
  format = (n) => `${Math.round(n)}%`,
}: ProgressRingProps) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.max(0, Math.min(1, value / max));

  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 80, damping: 18 });
  const offset = useTransform(spring, (v) => circumference - v * circumference);
  const display = useTransform(spring, (v) => format(v * max));

  useEffect(() => {
    motionValue.set(ratio);
  }, [motionValue, ratio]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5eaf73" />
            <stop offset="60%" stopColor="#5DD62C" />
            <stop offset="100%" stopColor="#337418" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={thickness}
          opacity={0.4}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span className="font-display text-2xl tracking-tight tabular">{display}</motion.span>
        {label && (
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-0.5">{label}</span>
        )}
      </div>
    </div>
  );
}
