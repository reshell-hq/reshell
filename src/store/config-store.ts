import { create } from "zustand";

export type ConfigSection =
  | "links"
  | "edges"
  | "canvas"
  | "workspaces"
  | "focusRadio"
  | "shortcuts"
  | "library";

type ConfigState = {
  open: boolean;
  section: ConfigSection;
  openSection: (section: ConfigSection) => void;
  openSettings: () => void;
  close: () => void;
};

export const useConfigStore = create<ConfigState>((set) => ({
  open: false,
  section: "links",
  openSection: (section) => set({ open: true, section }),
  openSettings: () => set({ open: true }),
  close: () => set({ open: false }),
}));
