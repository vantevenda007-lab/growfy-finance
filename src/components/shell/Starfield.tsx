import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  baseAlpha: number;
  twinkle: number;
}

interface StarfieldProps {
  density?: number;
  className?: string;
}

export function Starfield({ density = 0.00006, className }: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const starsRef = useRef<Star[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize(): void {
      if (!canvas || !ctx) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(w * h * density);
      starsRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: 0.3 + Math.random() * 0.7,
        size: 0.4 + Math.random() * 1.2,
        baseAlpha: 0.3 + Math.random() * 0.5,
        twinkle: Math.random() * Math.PI * 2,
      }));
    }

    resize();
    window.addEventListener('resize', resize);

    let lastTime = performance.now();

    function frame(time: number): void {
      if (!canvas || !ctx) return;
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      for (const star of starsRef.current) {
        if (!reduced) {
          star.twinkle += delta * 0.6;
          // Subtle drift
          star.y += delta * star.z * 4;
          if (star.y > canvas.height / dpr + 2) {
            star.y = -2;
            star.x = Math.random() * (canvas.width / dpr);
          }
        }
        const alpha = reduced
          ? star.baseAlpha
          : star.baseAlpha * (0.6 + 0.4 * Math.sin(star.twinkle));
        const isAccent = star.z > 0.92;
        const color = isAccent ? '160, 190, 230' : '255, 255, 255';
        ctx.fillStyle = `rgba(${color}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        if (star.size > 1.2) {
          ctx.fillStyle = `rgba(${color}, ${alpha * 0.15})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(frame);
    }

    if (!reduced) {
      animationRef.current = requestAnimationFrame(frame);
    } else {
      // Render once for static scene
      frame(performance.now());
    }

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 ${className ?? ''}`}
    />
  );
}
