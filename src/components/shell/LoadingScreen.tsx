import { motion } from 'framer-motion';

export function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#08080b]"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(18,52,153,0.18), transparent 70%)',
        }}
      />
      <div className="relative flex flex-col items-center gap-7">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative h-20 w-20"
        >
          <motion.div
            className="absolute inset-0 rounded-full border border-white/15"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.6)]" />
          </motion.div>
          <motion.div
            className="absolute inset-3 rounded-full"
            animate={{ scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(18,52,153,0.4) 60%, transparent 100%)',
            }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-2"
        >
          <div className="flex items-baseline">
            <span className="font-brand text-[24px] leading-none tracking-tight text-white">growfy</span>
            <span className="font-brand text-[24px] leading-none text-white">.</span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-white/40">
            Carregando painel
          </p>
        </motion.div>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="origin-left h-px w-40 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        />
      </div>
    </motion.div>
  );
}
