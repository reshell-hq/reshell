import { describe, expect, it } from "vitest";
import { LIBRARY_DB_NAME, PRODUCT_NAME, SNAPSHOT_DOWNLOAD_FILENAME } from "./branding";

describe("Reshell branding constants", () => {
  it("uses reshell as the IndexedDB database name", () => {
    expect(LIBRARY_DB_NAME).toBe("reshell");
  });

  it("names exported library snapshots reshell-snapshot.yaml", () => {
    expect(SNAPSHOT_DOWNLOAD_FILENAME).toBe("reshell-snapshot.yaml");
  });

  it("uses Reshell as the product name", () => {
    expect(PRODUCT_NAME).toBe("Reshell");
  });
});
