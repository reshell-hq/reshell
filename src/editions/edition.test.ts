import { describe, expect, it } from "vitest";
import {
  createEditionConfig,
  hasFeature,
  PERSONAL_EDITION,
  type FeatureFlag,
} from "./edition";

const ALL_FLAGS: FeatureFlag[] = ["cloudSync", "gamification", "agent", "team"];

describe("PERSONAL_EDITION", () => {
  it("is the personal edition with every paid feature off", () => {
    expect(PERSONAL_EDITION.edition).toBe("personal");
    for (const flag of ALL_FLAGS) {
      expect(hasFeature(PERSONAL_EDITION, flag)).toBe(false);
    }
  });
});

describe("createEditionConfig", () => {
  it("defaults unset feature flags to off", () => {
    const config = createEditionConfig("standard", { cloudSync: true });
    expect(config.edition).toBe("standard");
    expect(hasFeature(config, "cloudSync")).toBe(true);
    expect(hasFeature(config, "gamification")).toBe(false);
    expect(hasFeature(config, "agent")).toBe(false);
    expect(hasFeature(config, "team")).toBe(false);
  });

  it("turns every flag on when fully specified", () => {
    const config = createEditionConfig("team", {
      cloudSync: true,
      gamification: true,
      agent: true,
      team: true,
    });
    for (const flag of ALL_FLAGS) {
      expect(hasFeature(config, flag)).toBe(true);
    }
  });
});
