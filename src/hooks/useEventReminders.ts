import { useEffect } from 'react';
import { useStore } from '@/stores/useStore';
import {
  fireEventNotification,
  hasBeenNotified,
  markNotified,
  pruneNotified,
  reminderTimeFor,
} from '@/lib/notifications';
import { bannerFromEvent } from '@/components/shell/EventBanner';
import type { CalendarEvent } from '@/types';

function bannerFor(event: CalendarEvent): void {
  const clientName = useStore.getState().clients.find((c) => c.id === event.clientId)?.company;
  bannerFromEvent(event, { client: clientName });
}

/**
 * Schedules browser notifications for upcoming events.
 *
 * Uses a precise setTimeout to the next pending reminder rather than polling,
 * which is more reliable than setInterval (background tabs throttle intervals
 * heavily). Also runs a sweep on visibility change so we catch up after the
 * tab wakes from sleep.
 */
export function useEventReminders(): void {
  const events = useStore((s) => s.events);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return undefined;

    let timeoutId: number | null = null;
    let cancelled = false;

    function nextPending(now: Date): { event: CalendarEvent; fireAt: Date } | null {
      let best: { event: CalendarEvent; fireAt: Date } | null = null;
      for (const event of events) {
        if (event.completed) continue;
        if (hasBeenNotified(event.id)) continue;
        const fireAt = reminderTimeFor(event);
        if (!fireAt) continue;
        // Skip events whose window has fully expired (>30 min after fireAt).
        if (now.getTime() - fireAt.getTime() > 30 * 60_000) continue;
        if (!best || fireAt < best.fireAt) best = { event, fireAt };
      }
      return best;
    }

    function sweep(): void {
      if (cancelled) return;
      const now = new Date();
      pruneNotified(events.map((e) => e.id));

      // Fire any reminder whose window is open right now.
      for (const event of events) {
        if (event.completed) continue;
        if (hasBeenNotified(event.id)) continue;
        const fireAt = reminderTimeFor(event);
        if (!fireAt) continue;
        if (now < fireAt) continue;
        if (now.getTime() - fireAt.getTime() > 30 * 60_000) continue;
        // Fire OS notification AND in-app banner — banner is the reliable
        // fallback when OS-level notifications are blocked (Focus mode, etc).
        fireEventNotification(event);
        bannerFor(event);
        markNotified(event.id);
      }

      // Schedule the next pending reminder precisely.
      const next = nextPending(new Date());
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (!next) {
        timeoutId = null;
        return;
      }
      const delayMs = Math.max(1000, next.fireAt.getTime() - Date.now());
      // Cap at 24h — we'll re-evaluate after.
      const cap = Math.min(delayMs, 24 * 60 * 60_000);
      timeoutId = window.setTimeout(sweep, cap);
    }

    sweep();
    function onVisibility(): void {
      if (document.visibilityState === 'visible') sweep();
    }
    document.addEventListener('visibilitychange', onVisibility);
    // Safety net: re-sweep every 5 minutes even when foregrounded, in case
    // setTimeout was throttled while sleeping.
    const safetyId = window.setInterval(sweep, 5 * 60_000);

    return () => {
      cancelled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      window.clearInterval(safetyId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [events]);
}
