/**
 * Edition + feature configuration seam (ADR 0013/0014).
 *
 * The public OSS build is always the Personal edition with every paid feature
 * flag off. The private hosted compose overrides this via the EditionProvider to
 * light up Standard+ features without forking the shell UI.
 *
 * BOUNDARY (open-core): these flags are NOT entitlement enforcement. They never
 * gate bundled code in the public repo — the guarantee is code availability:
 * paid implementations live ONLY in the private repo. Flipping a flag in an OSS
 * fork enables nothing, because there is no paid code here to enable. Paid
 * capabilities enter exclusively through the registries (rim tools, command-bar
 * actions) and the LibraryStore factory, which are empty/default until private
 * code populates them. Public code must therefore never branch on a feature flag
 * to render a bundled paid feature. This is enforced by
 * `personal-edition-boundary.test.ts`.
 */

export type Edition = "personal" | "standard" | "pro" | "team";

export type FeatureFlag = "cloudSync" | "gamification" | "agent" | "team";

export type EditionFeatures = Readonly<Record<FeatureFlag, boolean>>;

export type EditionConfig = {
  readonly edition: Edition;
  readonly features: EditionFeatures;
};

const NO_FEATURES: EditionFeatures = {
  cloudSync: false,
  gamification: false,
  agent: false,
  team: false,
};

/** Default config for the public OSS build: Personal, no paid features. */
export const PERSONAL_EDITION: EditionConfig = {
  edition: "personal",
  features: NO_FEATURES,
};

/**
 * Build an edition config, defaulting every unset feature flag to off. The
 * private compose passes the editions it sells; the OSS build never calls this.
 */
export function createEditionConfig(
  edition: Edition,
  features: Partial<EditionFeatures> = {},
): EditionConfig {
  return {
    edition,
    features: { ...NO_FEATURES, ...features },
  };
}

export function hasFeature(config: EditionConfig, flag: FeatureFlag): boolean {
  return config.features[flag];
}
