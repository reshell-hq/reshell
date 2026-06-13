import { create } from "zustand";
import type { EdgePosition } from "@/library/types";

type LauncherState = {
  open: boolean;
  edge: EdgePosition | null;
  edgeGroupId: string | null;
  showFullCatalog: boolean;
  openFromEdgeGroup: (edge: EdgePosition, groupId: string) => void;
  close: () => void;
  toggleCatalog: () => void;
};

export const useLauncherStore = create<LauncherState>((set) => ({
  open: false,
  edge: null,
  edgeGroupId: null,
  showFullCatalog: false,
  openFromEdgeGroup: (edge, edgeGroupId) =>
    set({ open: true, edge, edgeGroupId, showFullCatalog: false }),
  close: () => set({ open: false, edge: null, edgeGroupId: null, showFullCatalog: false }),
  toggleCatalog: () => set((state) => ({ showFullCatalog: !state.showFullCatalog })),
}));
