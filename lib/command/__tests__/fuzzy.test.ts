import { describe, expect, it } from "vitest";
import { rank, score, type Rankable } from "../fuzzy";

describe("score", () => {
  it("matches a subsequence (non-contiguous, in order)", () => {
    expect(score("gh", "GitHub")).not.toBeNull();
    expect(score("ghb", "GitHub")).not.toBeNull();
  });

  it("rejects characters that are out of order or missing", () => {
    expect(score("hg", "GitHub")).toBeNull();
    expect(score("xyz", "GitHub")).toBeNull();
  });

  it("is case-insensitive and ignores surrounding whitespace", () => {
    expect(score("  GIT ", "github")).not.toBeNull();
  });

  it("returns 0 for an empty query (neutral, always matches)", () => {
    expect(score("", "anything")).toBe(0);
  });

  it("scores a contiguous prefix higher than a scattered match", () => {
    const prefix = score("git", "GitHub")!;
    const scattered = score("git", "Good is tough")!;
    expect(prefix).toBeGreaterThan(scattered);
  });

  it("rewards a word-start match over a mid-word match", () => {
    const wordStart = score("h", "Git Hub")!;
    const midWord = score("h", "Github")!;
    expect(wordStart).toBeGreaterThan(midWord);
  });
});

describe("rank", () => {
  const entries: Rankable[] = [
    { label: "GitHub" },
    { label: "GitLab" },
    { label: "Insightful", keywords: ["analytics"] },
  ];

  it("returns only matching entries, best first", () => {
    const result = rank("git", entries);
    expect(result.map((e) => e.label)).toEqual(["GitHub", "GitLab"]);
  });

  it("matches via keywords when the label does not match", () => {
    const result = rank("analytics", entries);
    expect(result.map((e) => e.label)).toEqual(["Insightful"]);
  });

  it("returns every entry in original order for an empty query", () => {
    const result = rank("", entries);
    expect(result.map((e) => e.label)).toEqual([
      "GitHub",
      "GitLab",
      "Insightful",
    ]);
  });

  it("does not mutate the input array", () => {
    const input = entries.slice();
    rank("git", input);
    expect(input).toEqual(entries);
  });
});
