import { useEffect } from 'react';
import { useStore } from '@/stores/useStore';
import {
  fireEventNotification,
  hasBeenNotified,
  markNotified,
  pruneNotified,
  reminderTimeFor,
} from '@/lib/notifications';

/**
 * Polls every minute and fires browser notifications for events whose reminder
 * window has just elapsed. Idempotent — keeps a localStorage set of notified IDs.
 */
export function useEventReminders(): void {
  const events = useStore((s) => s.events);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return undefined;

    function tick(): void {
      const now = new Date();
      pruneNotified(events.map((e) => e.id));

      for (const event of events) {
        if (event.completed) continue;
        if (hasBeenNotified(event.id)) continue;

        const fireAt = reminderTimeFor(event);
        if (!fireAt) continue;

        // Only fire if we're within the window: from fireAt up to event start time + 30 min.
        if (now < fireAt) continue;
        if (now.getTime() - fireAt.getTime() > 30 * 60_000) continue;

        const ok = fireEventNotification(event);
        if (ok) markNotified(event.id);
      }
    }

    tick();
    const handle = window.setInterval(tick, 60_000);
    return () => window.clearInterval(handle);
  }, [events]);
}
