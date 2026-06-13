import { describe, expect, it } from "vitest";
import { resolveFocusRadioStreamProxyUrl, validateFocusRadioStreamUrl } from "./stream-proxy";

describe("validateFocusRadioStreamUrl", () => {
  it("accepts public https stream URLs", () => {
    expect(validateFocusRadioStreamUrl("https://stream.example.com/lofi.mp3")).toEqual({
      ok: true,
      url: new URL("https://stream.example.com/lofi.mp3"),
    });
  });

  it("rejects missing and invalid URLs", () => {
    expect(validateFocusRadioStreamUrl(null)).toEqual({
      ok: false,
      error: "Missing stream URL",
    });
    expect(validateFocusRadioStreamUrl("not-a-url")).toEqual({
      ok: false,
      error: "Invalid stream URL",
    });
  });

  it("rejects non-http schemes and private hosts", () => {
    expect(validateFocusRadioStreamUrl("file:///tmp/radio.mp3")).toEqual({
      ok: false,
      error: "Stream URL must use http or https",
    });
    expect(validateFocusRadioStreamUrl("http://127.0.0.1:8000/stream")).toEqual({
      ok: false,
      error: "Stream URL host is not allowed",
    });
  });
});

describe("resolveFocusRadioStreamProxyUrl", () => {
  it("builds a same-origin proxy URL", () => {
    expect(resolveFocusRadioStreamProxyUrl("https://stream.example.com/live")).toBe(
      "/api/focus-radio/stream?url=https%3A%2F%2Fstream.example.com%2Flive",
    );
  });
});
