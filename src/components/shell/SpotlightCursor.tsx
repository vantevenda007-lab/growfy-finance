import { useEffect, useRef } from 'react';

export function SpotlightCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const isCoarse = window.matchMedia('(pointer: coarse)').matches;
    if (isCoarse) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let raf = 0;

    function onMove(event: PointerEvent): void {
      targetX = event.clientX;
      targetY = event.clientY;
    }

    function loop(): void {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      if (el) {
        el.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(loop);
    }

    window.addEventListener('pointermove', onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[5] h-[600px] w-[600px] rounded-full opacity-60 mix-blend-screen will-change-transform"
      style={{
        background:
          'radial-gradient(circle at center, rgba(94, 175, 115, 0.18) 0%, rgba(18, 52, 153, 0.12) 30%, rgba(0, 7, 45, 0) 65%)',
        transform: 'translate3d(0, 0, 0) translate(-50%, -50%)',
      }}
    />
  );
}
