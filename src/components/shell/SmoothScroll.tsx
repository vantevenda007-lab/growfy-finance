import { useEffect } from 'react';

export function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    let raf = 0;
    let currentScroll = window.scrollY;
    let targetScroll = currentScroll;
    let active = false;

    function onWheel(event: WheelEvent): void {
      if (event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      targetScroll = Math.max(
        0,
        Math.min(
          targetScroll + event.deltaY * 0.85,
          document.documentElement.scrollHeight - window.innerHeight,
        ),
      );
      if (!active) {
        active = true;
        raf = requestAnimationFrame(loop);
      }
    }

    function loop(): void {
      const delta = targetScroll - currentScroll;
      if (Math.abs(delta) < 0.3) {
        currentScroll = targetScroll;
        window.scrollTo(0, currentScroll);
        active = false;
        return;
      }
      currentScroll += delta * 0.12;
      window.scrollTo(0, currentScroll);
      raf = requestAnimationFrame(loop);
    }

    function onResize(): void {
      currentScroll = window.scrollY;
      targetScroll = currentScroll;
    }

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
