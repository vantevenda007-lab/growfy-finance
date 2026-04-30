import { motion } from 'framer-motion';

interface LogoProps {
  compact?: boolean;
}

export function Logo({ compact = false }: LogoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-baseline shrink-0 select-none"
    >
      <span className="font-brand text-[28px] leading-none tracking-tight text-foreground">
        growfy
      </span>
      <span className="font-brand text-[28px] leading-none text-accent">.</span>
      {!compact && (
        <span className="hidden sm:inline-block ml-2.5 pl-2.5 border-l border-border/60 text-[10px] uppercase tracking-[0.22em] text-muted-foreground self-center whitespace-nowrap">
          Finance
        </span>
      )}
    </motion.div>
  );
}
