import { describe, expect, it } from "vitest";
import {
  shouldCaptureTypeToFocusKey,
  shouldHandleTypeToFocus,
} from "./command-bar";

describe("shouldCaptureTypeToFocusKey", () => {
  it("captures printable keys without modifiers", () => {
    expect(
      shouldCaptureTypeToFocusKey({
        key: "j",
        ctrlKey: false,
        metaKey: false,
        altKey: false,
      }),
    ).toBe(true);
  });

  it("ignores modified keys and non-printable keys", () => {
    expect(
      shouldCaptureTypeToFocusKey({
        key: "j",
        ctrlKey: false,
        metaKey: true,
        altKey: false,
      }),
    ).toBe(false);
    expect(
      shouldCaptureTypeToFocusKey({
        key: "Tab",
        ctrlKey: false,
        metaKey: false,
        altKey: false,
      }),
    ).toBe(false);
  });
});

describe("shouldHandleTypeToFocus", () => {
  it("does not capture keys while settings or launcher overlays are open", () => {
    expect(
      shouldHandleTypeToFocus({
        event: { key: "h", ctrlKey: false, metaKey: false, altKey: false },
        activeElement: null,
        overlaysOpen: true,
      }),
    ).toBe(false);
  });
});
