/**
 * Pure YouTube URL parsing for music stations (CONTEXT: "Tool"). Zero React/DOM
 * deps (ADR-0009) so it is unit-tested in isolation and importable by any
 * consumer. A station's `url` resolves to either a single video id or a
 * playlist id — the player (`components/personal/youtube-player`) turns that
 * into a cued video / playlist.
 */

/** A resolved playback source for a station: one video, or a whole playlist. */
export type YoutubeSource =
  | { kind: "video"; id: string }
  | { kind: "playlist"; id: string };

// YouTube video ids are a fixed 11-char base64url-ish token; playlist ids are
// longer `PL…`/`UU…`/etc tokens. We don't over-validate — the IFrame API is the
// real arbiter — but a coarse shape check rejects obvious junk (`/watch?v=`).
const VIDEO_ID = /^[\w-]{11}$/;
const PLAYLIST_ID = /^[\w-]+$/;

const PATH_PREFIXES = ["/live/", "/embed/", "/shorts/", "/v/"] as const;

function parseUrl(raw: string): URL | null {
  try {
    return new URL(raw.trim());
  } catch {
    return null;
  }
}

function isYoutubeHost(host: string): boolean {
  const h = host.replace(/^www\./, "");
  return (
    h === "youtube.com" ||
    h === "m.youtube.com" ||
    h === "music.youtube.com" ||
    h === "youtu.be" ||
    h === "youtube-nocookie.com"
  );
}

/**
 * Extract a video id from any common YouTube URL form: `watch?v=`, `youtu.be/`,
 * `/live/`, `/embed/`, `/shorts/`, and the `music.youtube.com` host. Returns
 * null for non-YouTube or playlist-only URLs.
 */
export function parseYoutubeVideoId(url: string): string | null {
  const parsed = parseUrl(url);
  if (!parsed || !isYoutubeHost(parsed.hostname)) {
    return null;
  }

  // youtu.be/<id> — the id is the first path segment.
  if (parsed.hostname.replace(/^www\./, "") === "youtu.be") {
    const id = parsed.pathname.split("/").filter(Boolean)[0];
    return id && VIDEO_ID.test(id) ? id : null;
  }

  // watch?v=<id> (incl. music.youtube.com/watch).
  const v = parsed.searchParams.get("v");
  if (v && VIDEO_ID.test(v)) {
    return v;
  }

  // /live/<id>, /embed/<id>, /shorts/<id>, /v/<id>.
  for (const prefix of PATH_PREFIXES) {
    if (parsed.pathname.startsWith(prefix)) {
      const id = parsed.pathname.slice(prefix.length).split("/").filter(Boolean)[0];
      return id && VIDEO_ID.test(id) ? id : null;
    }
  }

  return null;
}

/**
 * Extract a playlist id (`list=`) from a YouTube URL, so a station can be a
 * whole playlist (auto-advancing). Returns null when there is no playlist.
 */
export function parseYoutubePlaylistId(url: string): string | null {
  const parsed = parseUrl(url);
  if (!parsed || !isYoutubeHost(parsed.hostname)) {
    return null;
  }
  const list = parsed.searchParams.get("list");
  return list && PLAYLIST_ID.test(list) ? list : null;
}

/**
 * Resolve a station URL to its playback source. A single video wins when the
 * URL carries a video id; otherwise a `list=` makes it a playlist station.
 *
 * ponytail: video-first is the simplest deterministic rule. Ceiling — a
 * `watch?v=…&list=…` link plays just the video, not the playlist. Upgrade path:
 * a per-station `playAs: "video" | "playlist"` field if a user needs the other.
 */
export function resolveStationSource(url: string): YoutubeSource | null {
  const videoId = parseYoutubeVideoId(url);
  if (videoId) {
    return { kind: "video", id: videoId };
  }
  const playlistId = parseYoutubePlaylistId(url);
  if (playlistId) {
    return { kind: "playlist", id: playlistId };
  }
  return null;
}
