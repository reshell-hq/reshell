"use client";

import { createContext, useContext, type ReactNode } from "react";
import { hasFeature, PERSONAL_EDITION, type EditionConfig, type FeatureFlag } from "./edition";

const EditionContext = createContext<EditionConfig>(PERSONAL_EDITION);

/**
 * Provides the active edition config to the shell. Defaults to the Personal
 * edition, so the OSS build works without ever mounting an override; the private
 * compose passes a `config` built with `createEditionConfig`.
 */
export function EditionProvider({
  config = PERSONAL_EDITION,
  children,
}: {
  config?: EditionConfig;
  children: ReactNode;
}) {
  return <EditionContext.Provider value={config}>{children}</EditionContext.Provider>;
}

export function useEdition(): EditionConfig {
  return useContext(EditionContext);
}

export function useFeature(flag: FeatureFlag): boolean {
  return hasFeature(useContext(EditionContext), flag);
}
