import { ensureLibraryDefaults } from "@/internal-tools/defaults";
import { assertCurrentLibrarySchema } from "./schema";
import { notifyLibraryChanged } from "./library-sync";
import { createStarterLibrary } from "./starter-template";
import {
  addCatalogLink as addCatalogLinkToLibrary,
  deleteCatalogLink as deleteCatalogLinkFromLibrary,
  updateCatalogLink as updateCatalogLinkInLibrary,
} from "./catalog";
import { deserializeSnapshot, importSnapshotFromUrl } from "@/snapshot/snapshot";
import type { LayoutPresetId } from "@/theme/layout-presets";
import type { ThemePresetId } from "@/theme/theme-presets";
import {
  applyLayoutPresetToWorkspace,
  applyThemePresetToWorkspace,
  updateWorkspaceTheme,
} from "@/theme/workspace-theme";
import {
  createWorkspace as createWorkspaceInLibrary,
  deleteWorkspace as deleteWorkspaceFromLibrary,
  renameWorkspace as renameWorkspaceInLibrary,
} from "@/workspace/workspaces";
import type {
  CatalogLinkInput,
  CatalogLinkPatch,
  Library,
  LibraryPatch,
  LibraryStore,
  ThemePatch,
} from "./types";

export function validateLibrary(_library: Library): void {}

export async function getLibrary(store: LibraryStore): Promise<Library | null> {
  return store.read();
}

async function persistLibrary(store: LibraryStore, library: Library): Promise<Library> {
  validateLibrary(library);
  await store.write(library);
  notifyLibraryChanged();
  return library;
}

export async function saveLibrary(store: LibraryStore, library: Library): Promise<Library> {
  return persistLibrary(store, library);
}

export async function loadOrSeedLibrary(store: LibraryStore): Promise<Library> {
  const existing = await store.read();
  if (existing) {
    assertCurrentLibrarySchema(existing);
    return ensureLibraryDefaults(existing);
  }

  const starter = createStarterLibrary();
  return persistLibrary(store, starter);
}

export async function resetLibrary(store: LibraryStore): Promise<Library> {
  const starter = createStarterLibrary();
  return persistLibrary(store, starter);
}

export async function applyPatch(store: LibraryStore, patch: LibraryPatch): Promise<Library> {
  const library = await store.read();
  if (!library) {
    throw new Error("Library not initialized");
  }

  const { shortcuts, displayName, ...rest } = patch;
  const next: Library = {
    ...library,
    ...rest,
    ...(shortcuts ? { shortcuts: { ...library.shortcuts, ...shortcuts } } : {}),
  };

  if (displayName !== undefined) {
    const trimmed = displayName?.trim();
    if (trimmed) {
      next.displayName = trimmed;
    } else {
      delete next.displayName;
    }
  }

  return persistLibrary(store, next);
}

export async function addCatalogLink(
  store: LibraryStore,
  input: CatalogLinkInput,
): Promise<Library> {
  const library = await store.read();
  if (!library) {
    throw new Error("Library not initialized");
  }

  const next = addCatalogLinkToLibrary(library, input);
  return saveLibrary(store, next);
}

export async function updateCatalogLink(
  store: LibraryStore,
  linkId: string,
  patch: CatalogLinkPatch,
): Promise<Library> {
  const library = await store.read();
  if (!library) {
    throw new Error("Library not initialized");
  }

  const next = updateCatalogLinkInLibrary(library, linkId, patch);
  return saveLibrary(store, next);
}

export async function deleteCatalogLink(store: LibraryStore, linkId: string): Promise<Library> {
  const library = await store.read();
  if (!library) {
    throw new Error("Library not initialized");
  }

  const next = deleteCatalogLinkFromLibrary(library, linkId);
  return saveLibrary(store, next);
}

export async function mutateLibrary(
  store: LibraryStore,
  mutate: (library: Library) => Library,
): Promise<Library> {
  const library = await store.read();
  if (!library) {
    throw new Error("Library not initialized");
  }

  return saveLibrary(store, mutate(library));
}

export async function createWorkspace(store: LibraryStore, name: string): Promise<Library> {
  const library = await store.read();
  if (!library) {
    throw new Error("Library not initialized");
  }

  return saveLibrary(store, createWorkspaceInLibrary(library, name));
}

export async function renameWorkspace(
  store: LibraryStore,
  workspaceId: string,
  name: string,
): Promise<Library> {
  const library = await store.read();
  if (!library) {
    throw new Error("Library not initialized");
  }

  return saveLibrary(store, renameWorkspaceInLibrary(library, workspaceId, name));
}

export async function deleteWorkspace(store: LibraryStore, workspaceId: string): Promise<Library> {
  const library = await store.read();
  if (!library) {
    throw new Error("Library not initialized");
  }

  return saveLibrary(store, deleteWorkspaceFromLibrary(library, workspaceId));
}

export async function updateWorkspaceThemeInLibrary(
  store: LibraryStore,
  workspaceId: string,
  patch: ThemePatch,
): Promise<Library> {
  const library = await store.read();
  if (!library) {
    throw new Error("Library not initialized");
  }

  return saveLibrary(store, updateWorkspaceTheme(library, workspaceId, patch));
}

export async function applyThemePresetInLibrary(
  store: LibraryStore,
  workspaceId: string,
  presetId: ThemePresetId,
): Promise<Library> {
  const library = await store.read();
  if (!library) {
    throw new Error("Library not initialized");
  }

  return saveLibrary(store, applyThemePresetToWorkspace(library, workspaceId, presetId));
}

export async function applyLayoutPresetInLibrary(
  store: LibraryStore,
  workspaceId: string,
  presetId: LayoutPresetId,
): Promise<Library> {
  const library = await store.read();
  if (!library) {
    throw new Error("Library not initialized");
  }

  return saveLibrary(store, applyLayoutPresetToWorkspace(library, workspaceId, presetId));
}

export async function importLibrarySnapshot(store: LibraryStore, yaml: string): Promise<Library> {
  const library = deserializeSnapshot(yaml);
  return saveLibrary(store, library);
}

export async function importLibrarySnapshotFromUrl(
  store: LibraryStore,
  url: string,
): Promise<Library> {
  const library = await importSnapshotFromUrl(url);
  return saveLibrary(store, library);
}

export { LIBRARY_SCHEMA_VERSION, StaleLibraryError } from "./schema";
