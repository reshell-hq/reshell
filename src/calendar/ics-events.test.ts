import { describe, expect, it } from "vitest";
import { countRemainingNextUpEvents, parseIcsEvents, selectNextUpEvents } from "./ics-events";

const SAMPLE_ICS = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:past-1
DTSTART:20260609T100000Z
DTEND:20260609T110000Z
SUMMARY:Past standup
END:VEVENT
BEGIN:VEVENT
UID:next-1
DTSTART:20260609T150000Z
DTEND:20260609T160000Z
SUMMARY:Design review
URL:https://example.com/design
END:VEVENT
BEGIN:VEVENT
UID:all-day-1
DTSTART;VALUE=DATE:20260609
SUMMARY:Ship day
END:VEVENT
END:VCALENDAR`;

describe("parseIcsEvents", () => {
  it("parses timed and all-day VEVENT blocks from ICS text", () => {
    const events = parseIcsEvents(SAMPLE_ICS);

    expect(events).toHaveLength(3);
    expect(events[1]).toMatchObject({
      uid: "next-1",
      title: "Design review",
      url: "https://example.com/design",
      allDay: false,
    });
    expect(events[2]).toMatchObject({
      uid: "all-day-1",
      title: "Ship day",
      allDay: true,
    });
  });
});

describe("selectNextUpEvents", () => {
  it("returns timed events from now forward and all-day events for today", () => {
    const events = parseIcsEvents(SAMPLE_ICS);
    const now = new Date("2026-06-09T14:00:00.000Z");

    expect(selectNextUpEvents(events, now).map((event) => event.uid)).toEqual([
      "all-day-1",
      "next-1",
    ]);
  });

  it("caps the visible list and reports overflow separately", () => {
    const events = parseIcsEvents(`${SAMPLE_ICS}
BEGIN:VEVENT
UID:next-2
DTSTART:20260609T170000Z
DTEND:20260609T180000Z
SUMMARY:Retro
END:VEVENT
BEGIN:VEVENT
UID:next-3
DTSTART:20260609T190000Z
DTEND:20260609T200000Z
SUMMARY:Deploy
END:VEVENT
BEGIN:VEVENT
UID:next-4
DTSTART:20260609T210000Z
DTEND:20260609T220000Z
SUMMARY:Wrap-up
END:VEVENT
BEGIN:VEVENT
UID:next-5
DTSTART:20260609T230000Z
DTEND:20260610T000000Z
SUMMARY:Late sync
END:VEVENT`);

    const now = new Date("2026-06-09T14:00:00.000Z");
    const visible = selectNextUpEvents(events, now, 5);

    expect(visible).toHaveLength(5);
    expect(countRemainingNextUpEvents(events, now, 5)).toBe(1);
  });
});
