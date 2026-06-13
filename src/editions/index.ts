/**
 * Edition extension seams for the public shell (ADR 0013/0014).
 *
 * Everything here is no-op / Personal edition by default so the OSS build is
 * unaffected. The private hosted compose imports these to register Standard+
 * capabilities (cloud store, agent rim tool, premium command-bar actions)
 * without forking shell UI.
 */
export {
  PERSONAL_EDITION,
  createEditionConfig,
  hasFeature,
  type Edition,
  type EditionConfig,
  type EditionFeatures,
  type FeatureFlag,
} from "./edition";
export { EditionProvider, useEdition, useFeature } from "./edition-context";
export { createRegistry, type Registry } from "./registry";
export {
  commandBarActionRegistry,
  type ExtraCommandBarAction,
} from "./command-bar-action-registry";
export { rimToolRegistry, type ExtraRimTool } from "./rim-tool-registry";
export {
  getLibraryStore,
  setLibraryStoreFactory,
  resetLibraryStoreFactory,
  type LibraryStoreFactory,
} from "./library-store-factory";
