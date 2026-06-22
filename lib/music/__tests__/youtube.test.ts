import { describe, expect, it } from "vitest";
import {
  parseYoutubePlaylistId,
  parseYoutubeVideoId,
  resolveStationSource,
} from "../youtube";

const VIDEO = "jfKfPfyJRdk";
const PLAYLIST = "PLOzDu-MXXLliO9fBNZOQTBDddoA3FzZUo";

describe("parseYoutubeVideoId", () => {
  it.each([
    ["watch?v=", `https://www.youtube.com/watch?v=${VIDEO}`],
    ["watch?v= with extra params", `https://www.youtube.com/watch?v=${VIDEO}&t=42s`],
    ["youtu.be short link", `https://youtu.be/${VIDEO}`],
    ["youtu.be with query", `https://youtu.be/${VIDEO}?si=abc`],
    ["/live/", `https://www.youtube.com/live/${VIDEO}`],
    ["/embed/", `https://www.youtube.com/embed/${VIDEO}`],
    ["/shorts/", `https://www.youtube.com/shorts/${VIDEO}`],
    ["/v/", `https://www.youtube.com/v/${VIDEO}`],
    ["music.youtube.com", `https://music.youtube.com/watch?v=${VIDEO}`],
    ["m.youtube.com", `https://m.youtube.com/watch?v=${VIDEO}`],
    ["no www", `https://youtube.com/watch?v=${VIDEO}`],
    ["nocookie embed", `https://www.youtube-nocookie.com/embed/${VIDEO}`],
  ])("extracts the id from %s", (_label, url) => {
    expect(parseYoutubeVideoId(url)).toBe(VIDEO);
  });

  it("extracts the video id even when a playlist is present", () => {
    expect(
      parseYoutubeVideoId(`https://www.youtube.com/watch?v=${VIDEO}&list=${PLAYLIST}`),
    ).toBe(VIDEO);
  });

  it.each([
    ["non-YouTube host", "https://vimeo.com/12345"],
    ["playlist-only URL", `https://www.youtube.com/playlist?list=${PLAYLIST}`],
    ["bare YouTube home", "https://www.youtube.com/"],
    ["malformed string", "not a url"],
    ["empty string", ""],
    ["wrong-length id", "https://www.youtube.com/watch?v=short"],
  ])("returns null for %s", (_label, url) => {
    expect(parseYoutubeVideoId(url)).toBeNull();
  });
});

describe("parseYoutubePlaylistId", () => {
  it("extracts a playlist id from a playlist URL", () => {
    expect(
      parseYoutubePlaylistId(`https://www.youtube.com/playlist?list=${PLAYLIST}`),
    ).toBe(PLAYLIST);
  });

  it("extracts a playlist id from a watch URL carrying list=", () => {
    expect(
      parseYoutubePlaylistId(`https://www.youtube.com/watch?v=${VIDEO}&list=${PLAYLIST}`),
    ).toBe(PLAYLIST);
  });

  it.each([
    ["no list param", `https://www.youtube.com/watch?v=${VIDEO}`],
    ["non-YouTube host", `https://example.com/playlist?list=${PLAYLIST}`],
    ["malformed string", "nope"],
  ])("returns null for %s", (_label, url) => {
    expect(parseYoutubePlaylistId(url)).toBeNull();
  });
});

describe("resolveStationSource", () => {
  it("resolves a plain video URL to a video source", () => {
    expect(resolveStationSource(`https://youtu.be/${VIDEO}`)).toEqual({
      kind: "video",
      id: VIDEO,
    });
  });

  it("resolves a playlist-only URL to a playlist source", () => {
    expect(
      resolveStationSource(`https://www.youtube.com/playlist?list=${PLAYLIST}`),
    ).toEqual({ kind: "playlist", id: PLAYLIST });
  });

  it("prefers the video when a watch URL carries both v= and list=", () => {
    expect(
      resolveStationSource(`https://www.youtube.com/watch?v=${VIDEO}&list=${PLAYLIST}`),
    ).toEqual({ kind: "video", id: VIDEO });
  });

  it("returns null for a non-YouTube URL", () => {
    expect(resolveStationSource("https://example.com/song.mp3")).toBeNull();
  });
});
