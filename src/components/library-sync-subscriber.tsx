"use client";

import { useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { getLibrarySync } from "@/library/library-sync";

export function LibrarySyncSubscriber({ queryClient }: { queryClient: QueryClient }) {
  useEffect(() => {
    return getLibrarySync().subscribe(() => {
      void queryClient.invalidateQueries({ queryKey: ["library"] });
    });
  }, [queryClient]);

  return null;
}
