"use client";

import { useCallback, useEffect, useState } from "react";
import { getLibraryStore } from "@/editions/library-store-factory";
import { getLibrarySync } from "@/library/library-sync";
import {
  resolveStartPageLibrary,
  type ResolvedStartPageLibrary,
} from "@/start/resolve-start-page-library";
import {
  initialStartPagePhase,
  readyStartPagePhase,
  type StartPagePhase,
} from "@/start/start-page-shell";

export function useStartPageLibrary(): {
  phase: StartPagePhase;
  resolved: ResolvedStartPageLibrary | null;
} {
  const [phase, setPhase] = useState<StartPagePhase>(initialStartPagePhase);
  const [resolved, setResolved] = useState<ResolvedStartPageLibrary | null>(null);

  const refresh = useCallback(() => {
    void resolveStartPageLibrary(getLibraryStore()).then((next) => {
      setResolved(next);
      setPhase(readyStartPagePhase());
    });
  }, []);

  useEffect(() => {
    refresh();
    return getLibrarySync().subscribe(refresh);
  }, [refresh]);

  return { phase, resolved };
}
