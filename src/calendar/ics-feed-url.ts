const PRIVATE_IPV4_PATTERN = /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.)/;

export function validateIcsFeedUrl(
  rawUrl: string | null | undefined,
): { ok: true; url: URL } | { ok: false; error: string } {
  if (!rawUrl?.trim()) {
    return { ok: false, error: "Missing calendar feed URL" };
  }

  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return { ok: false, error: "Invalid calendar feed URL" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: "Calendar feed URL must use http or https" };
  }

  const hostname = url.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "[::1]" ||
    hostname === "::1" ||
    PRIVATE_IPV4_PATTERN.test(hostname)
  ) {
    return { ok: false, error: "Calendar feed URL host is not allowed" };
  }

  return { ok: true, url };
}

export function resolveCalendarIcsProxyUrl(feedUrl: string): string {
  return `/api/calendar/ics?url=${encodeURIComponent(feedUrl)}`;
}

export function describeIcsFeedFetchError(status: number, feedUrl: string): string | null {
  if (status !== 404 && status !== 403) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(feedUrl);
  } catch {
    return status === 404
      ? "Check that the ICS URL is copied exactly from your calendar provider."
      : null;
  }

  if (url.hostname !== "calendar.google.com") {
    return status === 404
      ? "Check that the ICS URL is copied exactly from your calendar provider."
      : null;
  }

  const isPublicBasic = url.pathname.endsWith("/public/basic.ics");
  const calendarId = url.pathname.match(/\/ical\/([^/]+)\//)?.[1] ?? "";
  const looksLikeEmail = calendarId.includes("@") || calendarId.includes("%40");

  if (status === 404 && isPublicBasic && looksLikeEmail) {
    return "This looks like a guessed public Google Calendar URL. Open Google Calendar → Settings → your calendar → Integrate calendar, then copy Secret address in iCal format.";
  }

  if (status === 404) {
    return "Google Calendar returned 404. Copy the Secret address in iCal format from Integrate calendar (or enable public sharing if you use a public address).";
  }

  return "Google Calendar denied access. Make sure the calendar is shared and you copied the full secret ICS address.";
}
