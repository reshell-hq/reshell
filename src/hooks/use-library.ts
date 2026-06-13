"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addCatalogLink,
  applyPatch,
  createWorkspace,
  deleteCatalogLink,
  deleteWorkspace,
  importLibrarySnapshotFromUrl,
  loadOrSeedLibrary,
  mutateLibrary,
  renameWorkspace,
  resetLibrary,
  saveLibrary,
  updateCatalogLink,
  applyLayoutPresetInLibrary,
  applyThemePresetInLibrary,
  updateWorkspaceThemeInLibrary,
} from "@/library/library";
import type { LayoutPresetId } from "@/theme/layout-presets";
import type { ThemePresetId } from "@/theme/theme-presets";
import { getLibraryStore } from "@/editions/library-store-factory";
import type {
  CatalogLinkInput,
  CatalogLinkPatch,
  Library,
  LibraryPatch,
  ThemePatch,
} from "@/library/types";

export function useLibrary() {
  return useQuery({
    queryKey: ["library"],
    queryFn: () => loadOrSeedLibrary(getLibraryStore()),
  });
}

export function useApplyLibraryPatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: LibraryPatch) => applyPatch(getLibraryStore(), patch),
    onSuccess: (library) => {
      queryClient.setQueryData(["library"], library);
    },
  });
}

export function useSaveLibrary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (library: Library) => saveLibrary(getLibraryStore(), library),
    onSuccess: (library) => {
      queryClient.setQueryData(["library"], library);
    },
  });
}

export function useResetLibrary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => resetLibrary(getLibraryStore()),
    onSuccess: (library) => {
      queryClient.setQueryData(["library"], library);
    },
  });
}

export function useAddCatalogLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CatalogLinkInput) => addCatalogLink(getLibraryStore(), input),
    onSuccess: (library) => {
      queryClient.setQueryData(["library"], library);
    },
  });
}

export function useUpdateCatalogLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ linkId, patch }: { linkId: string; patch: CatalogLinkPatch }) =>
      updateCatalogLink(getLibraryStore(), linkId, patch),
    onSuccess: (library) => {
      queryClient.setQueryData(["library"], library);
    },
  });
}

export function useDeleteCatalogLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (linkId: string) => deleteCatalogLink(getLibraryStore(), linkId),
    onSuccess: (library) => {
      queryClient.setQueryData(["library"], library);
    },
  });
}

export function useMutateLibrary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mutate: (library: Library) => Library) => mutateLibrary(getLibraryStore(), mutate),
    onSuccess: (library) => {
      queryClient.setQueryData(["library"], library);
    },
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createWorkspace(getLibraryStore(), name),
    onSuccess: (library) => {
      queryClient.setQueryData(["library"], library);
    },
  });
}

export function useRenameWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, name }: { workspaceId: string; name: string }) =>
      renameWorkspace(getLibraryStore(), workspaceId, name),
    onSuccess: (library) => {
      queryClient.setQueryData(["library"], library);
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workspaceId: string) => deleteWorkspace(getLibraryStore(), workspaceId),
    onSuccess: (library) => {
      queryClient.setQueryData(["library"], library);
    },
  });
}

export function useUpdateWorkspaceTheme() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, patch }: { workspaceId: string; patch: ThemePatch }) =>
      updateWorkspaceThemeInLibrary(getLibraryStore(), workspaceId, patch),
    onSuccess: (library) => {
      queryClient.setQueryData(["library"], library);
    },
  });
}

export function useApplyThemePreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      presetId,
    }: {
      workspaceId: string;
      presetId: ThemePresetId;
    }) => applyThemePresetInLibrary(getLibraryStore(), workspaceId, presetId),
    onSuccess: (library) => {
      queryClient.setQueryData(["library"], library);
    },
  });
}

export function useApplyLayoutPreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      presetId,
    }: {
      workspaceId: string;
      presetId: LayoutPresetId;
    }) => applyLayoutPresetInLibrary(getLibraryStore(), workspaceId, presetId),
    onSuccess: (library) => {
      queryClient.setQueryData(["library"], library);
    },
  });
}

export function useImportLibrarySnapshot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (url: string) => importLibrarySnapshotFromUrl(getLibraryStore(), url),
    onSuccess: (library) => {
      queryClient.setQueryData(["library"], library);
    },
  });
}
