import { describe, expect, it } from "vitest";
import {
  describeIcsFeedFetchError,
  resolveCalendarIcsProxyUrl,
  validateIcsFeedUrl,
} from "./ics-feed-url";

describe("validateIcsFeedUrl", () => {
  it("accepts public https ICS URLs", () => {
    expect(
      validateIcsFeedUrl("https://calendar.google.com/calendar/ical/example/private-abc/basic.ics"),
    ).toEqual({
      ok: true,
      url: new URL("https://calendar.google.com/calendar/ical/example/private-abc/basic.ics"),
    });
  });

  it("rejects missing and invalid URLs", () => {
    expect(validateIcsFeedUrl(null)).toEqual({
      ok: false,
      error: "Missing calendar feed URL",
    });
    expect(validateIcsFeedUrl("not-a-url")).toEqual({
      ok: false,
      error: "Invalid calendar feed URL",
    });
  });

  it("rejects non-http schemes and private hosts", () => {
    expect(validateIcsFeedUrl("file:///tmp/calendar.ics")).toEqual({
      ok: false,
      error: "Calendar feed URL must use http or https",
    });
    expect(validateIcsFeedUrl("http://127.0.0.1:8000/feed.ics")).toEqual({
      ok: false,
      error: "Calendar feed URL host is not allowed",
    });
  });
});

describe("resolveCalendarIcsProxyUrl", () => {
  it("builds a same-origin proxy URL", () => {
    expect(resolveCalendarIcsProxyUrl("https://calendar.example.com/work.ics")).toBe(
      "/api/calendar/ics?url=https%3A%2F%2Fcalendar.example.com%2Fwork.ics",
    );
  });
});

describe("describeIcsFeedFetchError", () => {
  it("flags guessed Google public URLs that use an email calendar id", () => {
    expect(
      describeIcsFeedFetchError(
        404,
        "https://calendar.google.com/calendar/ical/jack.kitto%40gmail.com/public/basic.ics",
      ),
    ).toMatch(/Secret address in iCal format/);
  });

  it("returns a generic Google hint for other 404s", () => {
    expect(
      describeIcsFeedFetchError(
        404,
        "https://calendar.google.com/calendar/ical/example/private-abc/basic.ics",
      ),
    ).toMatch(/Google Calendar returned 404/);
  });

  it("returns null for non-actionable statuses", () => {
    expect(describeIcsFeedFetchError(500, "https://calendar.example.com/work.ics")).toBeNull();
  });
});
