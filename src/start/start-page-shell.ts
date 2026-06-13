import { RESHELL_ROUTES } from "@/routing/routes";

export type StartPagePhase = "loading" | "ready";

export type StartPageShellContent = {
  loadingLabel: string;
  commandBarPlaceholder: string;
  loadConfigPrompt: string;
  homeStationHref: string;
  homeStationLinkLabel: string;
};

export function getStartPageShellContent(): StartPageShellContent {
  return {
    loadingLabel: "Loading your library…",
    commandBarPlaceholder: "Search links…",
    loadConfigPrompt:
      "Using starter links. Open home station to load your library or import a snapshot.",
    homeStationHref: RESHELL_ROUTES.homeStation,
    homeStationLinkLabel: "Open home station",
  };
}

export function initialStartPagePhase(): StartPagePhase {
  return "loading";
}

export function readyStartPagePhase(): StartPagePhase {
  return "ready";
}
