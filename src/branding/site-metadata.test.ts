import { describe, expect, it } from "vitest";
import { siteMetadata } from "./site-metadata";

describe("site metadata", () => {
  it("sets the browser tab title with the product name", () => {
    expect(siteMetadata.title).toContain("Reshell");
  });
});
