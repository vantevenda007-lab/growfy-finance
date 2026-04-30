import { motion } from 'framer-motion';

interface SparklineProps {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
  fillOpacity?: number;
}

export function Sparkline({
  values,
  color = '#5DD62C',
  width = 96,
  height = 28,
  fillOpacity = 0.18,
}: SparklineProps) {
  if (values.length === 0) {
    return <span className="inline-block opacity-30 text-xs tabular">—</span>;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1 || 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`))
    .join(' ');
  const fillPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  const last = points[points.length - 1];
  const isUp = values[values.length - 1] >= values[0];
  const lineColor = color || (isUp ? '#5DD62C' : '#E74C3C');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-fill-${lineColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={fillOpacity * 1.5} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <motion.path
        d={fillPath}
        fill={`url(#spark-fill-${lineColor.replace('#', '')})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke={lineColor}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
      {last && (
        <motion.circle
          cx={last[0]}
          cy={last[1]}
          r={2.5}
          fill={lineColor}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.85 }}
        />
      )}
    </svg>
  );
}
