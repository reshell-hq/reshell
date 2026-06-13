import type { CalendarEvent } from "./ics-events";

export function formatCalendarEventTime(event: CalendarEvent, locale = "en-US"): string {
  if (event.allDay) {
    return "All day";
  }

  const start = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
  }).format(event.startsAt);

  if (!event.endsAt) {
    return start;
  }

  const end = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
  }).format(event.endsAt);

  return `${start} – ${end}`;
}
