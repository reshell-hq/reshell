import { describe, expect, it } from "vitest";
import { parseQuery } from "../parse";

describe("parseQuery", () => {
  it("classifies plain input as nav mode and keeps the query verbatim", () => {
    expect(parseQuery("git")).toEqual({ mode: "nav", query: "git" });
    expect(parseQuery("")).toEqual({ mode: "nav", query: "" });
  });

  it("treats a leading `:` as verb mode and strips the prefix", () => {
    expect(parseQuery(":timer")).toEqual({ mode: "verb", query: "timer" });
  });

  it("treats a leading `>` as verb mode and strips the prefix", () => {
    expect(parseQuery(">scene editorial")).toEqual({
      mode: "verb",
      query: "scene editorial",
    });
  });

  it("trims whitespace after the verb prefix", () => {
    expect(parseQuery(">  scene")).toEqual({ mode: "verb", query: "scene" });
  });

  it("only treats a leading prefix as a verb, not a mid-string one", () => {
    expect(parseQuery("a:b")).toEqual({ mode: "nav", query: "a:b" });
  });

  it("handles a bare prefix as an empty verb query (show all verbs)", () => {
    expect(parseQuery(":")).toEqual({ mode: "verb", query: "" });
    expect(parseQuery(">")).toEqual({ mode: "verb", query: "" });
  });
});
