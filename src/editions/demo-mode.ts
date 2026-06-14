import { createDemoLibraryStore } from "./demo-library-store";
import { resetLibraryStoreFactory, setLibraryStoreFactory } from "./library-store-factory";

let demoModeEnabled = false;

export function enableDemoMode(): void {
  demoModeEnabled = true;
}

export function isDemoMode(): boolean {
  return demoModeEnabled;
}

/** Test helper: restore default Personal edition runtime. */
export function resetDemoMode(): void {
  demoModeEnabled = false;
  resetLibraryStoreFactory();
}

/**
 * Wire the demo shell before the library store is first resolved. The private
 * compose calls this once when mounting `/demo`.
 */
export function initializeDemoShell(): void {
  if (demoModeEnabled) {
    return;
  }

  enableDemoMode();
  setLibraryStoreFactory(createDemoLibraryStore);
}
