const PRIVATE_IPV4_PATTERN = /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.)/;

export function validateFocusRadioStreamUrl(
  rawUrl: string | null | undefined,
): { ok: true; url: URL } | { ok: false; error: string } {
  if (!rawUrl?.trim()) {
    return { ok: false, error: "Missing stream URL" };
  }

  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return { ok: false, error: "Invalid stream URL" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: "Stream URL must use http or https" };
  }

  const hostname = url.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "[::1]" ||
    hostname === "::1" ||
    PRIVATE_IPV4_PATTERN.test(hostname)
  ) {
    return { ok: false, error: "Stream URL host is not allowed" };
  }

  return { ok: true, url };
}

export function resolveFocusRadioStreamProxyUrl(streamUrl: string): string {
  return `/api/focus-radio/stream?url=${encodeURIComponent(streamUrl)}`;
}
