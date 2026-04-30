import { motion } from 'framer-motion';

export function MeshBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div
        className="absolute -top-[20%] -left-[10%] h-[600px] w-[600px] rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #123499 0%, transparent 60%)' }}
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -60, 40, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[40%] -right-[15%] h-[500px] w-[500px] rounded-full opacity-10 blur-3xl"
        style={{ background: 'radial-gradient(circle, #0a2472 0%, transparent 60%)' }}
        animate={{
          x: [0, -60, 30, 0],
          y: [0, 50, -30, 0],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[10%] left-[30%] h-[400px] w-[400px] rounded-full opacity-[0.06] blur-3xl"
        style={{ background: 'radial-gradient(circle, #1f3a8a 0%, transparent 60%)' }}
        animate={{
          x: [0, 40, -50, 0],
          y: [0, -40, 30, 0],
          scale: [1, 1.05, 1.1, 1],
        }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
