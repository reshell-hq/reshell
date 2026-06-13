export type CalendarEvent = {
  uid: string;
  title: string;
  startsAt: Date;
  endsAt: Date | null;
  allDay: boolean;
  url?: string;
  location?: string;
  description?: string;
};

function unfoldIcsLines(text: string): string[] {
  const rawLines = text.replace(/\r\n/g, "\n").split("\n");
  const lines: string[] = [];

  for (const line of rawLines) {
    if (line.startsWith(" ") || line.startsWith("\t")) {
      lines[lines.length - 1] += line.slice(1);
      continue;
    }
    lines.push(line);
  }

  return lines;
}

function parseIcsDate(value: string, allDay: boolean): Date {
  if (allDay) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6)) - 1;
    const day = Number(value.slice(6, 8));
    return new Date(year, month, day);
  }

  if (value.endsWith("Z")) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6)) - 1;
    const day = Number(value.slice(6, 8));
    const hour = Number(value.slice(9, 11));
    const minute = Number(value.slice(11, 13));
    const second = Number(value.slice(13, 15) || "0");
    return new Date(Date.UTC(year, month, day, hour, minute, second));
  }

  return new Date(value);
}

function parseEventBlock(lines: string[]): CalendarEvent | null {
  const fields = new Map<string, string>();

  for (const line of lines) {
    const separator = line.indexOf(":");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).split(";")[0]!.toUpperCase();
    fields.set(key, line.slice(separator + 1));
  }

  const startRaw = fields.get("DTSTART");
  const title = fields.get("SUMMARY");
  const uid = fields.get("UID");

  if (!startRaw || !title || !uid) {
    return null;
  }

  const allDay = startRaw.length === 8;
  const startsAt = parseIcsDate(startRaw, allDay);
  const endRaw = fields.get("DTEND");
  const endsAt = endRaw ? parseIcsDate(endRaw, allDay) : null;

  return {
    uid,
    title,
    startsAt,
    endsAt,
    allDay,
    ...(fields.get("URL") ? { url: fields.get("URL") } : {}),
    ...(fields.get("LOCATION") ? { location: fields.get("LOCATION") } : {}),
    ...(fields.get("DESCRIPTION") ? { description: fields.get("DESCRIPTION") } : {}),
  };
}

export function parseIcsEvents(icsText: string): CalendarEvent[] {
  const lines = unfoldIcsLines(icsText);
  const events: CalendarEvent[] = [];
  let index = 0;

  while (index < lines.length) {
    if (lines[index] !== "BEGIN:VEVENT") {
      index += 1;
      continue;
    }

    index += 1;
    const block: string[] = [];

    while (index < lines.length && lines[index] !== "END:VEVENT") {
      block.push(lines[index]!);
      index += 1;
    }

    const event = parseEventBlock(block);
    if (event) {
      events.push(event);
    }

    index += 1;
  }

  return events;
}

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function isAllDayEventVisibleToday(event: CalendarEvent, now: Date): boolean {
  return localDateKey(event.startsAt) === localDateKey(now);
}

export function selectNextUpEvents(events: CalendarEvent[], now: Date, limit = 5): CalendarEvent[] {
  const upcoming = events
    .filter((event) => {
      if (event.allDay) {
        return isAllDayEventVisibleToday(event, now);
      }

      const end = event.endsAt ?? event.startsAt;
      return end >= now;
    })
    .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());

  return upcoming.slice(0, limit);
}

export function countRemainingNextUpEvents(events: CalendarEvent[], now: Date, limit = 5): number {
  const upcomingCount = events.filter((event) => {
    if (event.allDay) {
      return isAllDayEventVisibleToday(event, now);
    }

    const end = event.endsAt ?? event.startsAt;
    return end >= now;
  }).length;

  return Math.max(0, upcomingCount - limit);
}
