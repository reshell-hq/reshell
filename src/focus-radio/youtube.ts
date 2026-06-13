export function resolveYoutubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function parseYoutubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      return id || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }

      const [segment, id] = parsed.pathname.split("/").filter(Boolean);
      if ((segment === "live" || segment === "embed" || segment === "v" || segment === "shorts") && id) {
        return id;
      }
    }

    return null;
  } catch {
    return null;
  }
}
