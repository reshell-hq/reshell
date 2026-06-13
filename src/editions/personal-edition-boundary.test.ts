import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createIndexedDbLibraryStore } from "@/library/indexed-db-store";
import { commandBarActionRegistry } from "./command-bar-action-registry";
import { hasFeature, PERSONAL_EDITION, type FeatureFlag } from "./edition";
import { getLibraryStore } from "./library-store-factory";
import { rimToolRegistry } from "./rim-tool-registry";
// Importing the registry/store consumers proves nothing self-registers at import time.
import "@/command-bar/command-bar";
import "@/shell-frame/build-zones";

const SRC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ALL_FLAGS: FeatureFlag[] = ["cloudSync", "gamification", "agent", "team"];

/**
 * Open-core boundary (ADR 0013): paid features live ONLY in the private compose.
 * The public build must never gate bundled behavior on an edition flag, and must
 * never self-register a paid capability — otherwise a fork could flip a flag (or
 * call a registry) and "unlock" something. Paid capabilities may only enter via
 * the registries / store factory, which private code populates. These patterns,
 * found outside `src/editions/`, would break that guarantee.
 */
const FORBIDDEN_PATTERNS = [
  "useFeature(",
  "hasFeature(",
  "commandBarActionRegistry.register",
  "rimToolRegistry.register",
  "setLibraryStoreFactory(",
  "features.cloudSync",
  "features.gamification",
  "features.agent",
  "features.team",
];

function collectPublicSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // The editions seam itself defines the API; it is allowed to use it.
      if (entry.name === "editions") {
        continue;
      }
      files.push(...collectPublicSourceFiles(fullPath));
      continue;
    }
    if (!/\.tsx?$/.test(entry.name) || /\.test\.tsx?$/.test(entry.name)) {
      continue;
    }
    files.push(fullPath);
  }
  return files;
}

describe("personal edition boundary", () => {
  it("ships Personal with every paid feature flag off", () => {
    expect(PERSONAL_EDITION.edition).toBe("personal");
    for (const flag of ALL_FLAGS) {
      expect(hasFeature(PERSONAL_EDITION, flag)).toBe(false);
    }
  });

  it("registers no paid capability at import time in the OSS build", () => {
    expect(commandBarActionRegistry.list()).toEqual([]);
    expect(rimToolRegistry.list()).toEqual([]);
  });

  it("defaults the library store to the local IndexedDB store", () => {
    const store = getLibraryStore();
    expect(Object.keys(store).sort()).toEqual(Object.keys(createIndexedDbLibraryStore()).sort());
  });

  it("has no flag-gated paid feature code outside the editions seam", () => {
    const offenders: string[] = [];
    for (const file of collectPublicSourceFiles(SRC_DIR)) {
      const content = readFileSync(file, "utf8");
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (content.includes(pattern)) {
          offenders.push(`${path.relative(SRC_DIR, file)} → ${pattern}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
