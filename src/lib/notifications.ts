import type { CalendarEvent } from '@/types';

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

const NOTIFIED_KEY = 'growfy.notified.events.v1';

/** Returns the browser's current Notification permission, or 'unsupported' if API missing. */
export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

/** Request permission from the user. Returns the resulting state. */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!('Notification' in window)) return 'unsupported';
  try {
    const result = await Notification.requestPermission();
    return result as NotificationPermissionState;
  } catch {
    return 'denied';
  }
}

/** Compose the JS Date when an event's reminder should fire. Returns null if no reminder. */
export function reminderTimeFor(event: CalendarEvent): Date | null {
  if (!event.reminderMinutes || event.completed) return null;
  if (event.allDay || !event.startTime) {
    // For all-day events, fire reminder at 09:00 on the event date.
    const [y, m, d] = event.date.split('-').map(Number);
    const at = new Date(y, m - 1, d, 9, 0, 0);
    at.setMinutes(at.getMinutes() - event.reminderMinutes);
    return at;
  }
  const [y, m, d] = event.date.split('-').map(Number);
  const [hh, mm] = event.startTime.split(':').map(Number);
  const at = new Date(y, m - 1, d, hh, mm, 0);
  at.setMinutes(at.getMinutes() - event.reminderMinutes);
  return at;
}

/** Tracks IDs we've already notified, persisted in localStorage. */
function readNotified(): Set<string> {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeNotified(set: Set<string>): void {
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(Array.from(set)));
}

/** Mark an event as notified so we don't fire duplicates. */
export function markNotified(eventId: string): void {
  const set = readNotified();
  set.add(eventId);
  writeNotified(set);
}

export function hasBeenNotified(eventId: string): boolean {
  return readNotified().has(eventId);
}

/** Remove notified IDs that no longer match any active event (clean up). */
export function pruneNotified(activeIds: string[]): void {
  const set = readNotified();
  const active = new Set(activeIds);
  const next = new Set<string>();
  for (const id of set) if (active.has(id)) next.add(id);
  writeNotified(next);
}

/** Format a relative time line for the notification body. */
function formatEventLine(event: CalendarEvent): string {
  if (event.allDay) return 'Hoje · dia todo';
  return `Hoje às ${event.startTime}${event.endTime ? ` – ${event.endTime}` : ''}`;
}

/** Fire a browser notification for an event. Returns true if shown. */
export function fireEventNotification(event: CalendarEvent): boolean {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;
  try {
    const n = new Notification(`📅 ${event.title}`, {
      body: [formatEventLine(event), event.location, event.description]
        .filter((s): s is string => Boolean(s && s.trim()))
        .join(' · ')
        .slice(0, 180),
      tag: `growfy-event-${event.id}`,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      requireInteraction: false,
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
    return true;
  } catch {
    return false;
  }
}

export const REMINDER_PRESETS: { label: string; value: number }[] = [
  { label: 'Sem lembrete', value: 0 },
  { label: '5 minutos antes', value: 5 },
  { label: '10 minutos antes', value: 10 },
  { label: '15 minutos antes', value: 15 },
  { label: '30 minutos antes', value: 30 },
  { label: '1 hora antes', value: 60 },
  { label: '1 dia antes', value: 1440 },
];
