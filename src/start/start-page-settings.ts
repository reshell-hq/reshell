import { RESHELL_ROUTES } from "@/routing/routes";

export type StartPageSettingsContent = {
  bookmarkPath: string;
  bookmarkLabel: string;
  helperText: string;
  copyButtonLabel: string;
};

export function getStartPageSettingsContent(): StartPageSettingsContent {
  return {
    bookmarkPath: RESHELL_ROUTES.startPage,
    bookmarkLabel: "New tab URL",
    helperText:
      "Open home station once to seed your library. Pin /home for the full shell. Bookmark /start as your browser new-tab page.",
    copyButtonLabel: "Copy URL",
  };
}
