"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { LibrarySyncSubscriber } from "@/components/library-sync-subscriber";
import { EditionProvider } from "@/editions/edition-context";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <EditionProvider>
      <QueryClientProvider client={queryClient}>
        <LibrarySyncSubscriber queryClient={queryClient} />
        {children}
      </QueryClientProvider>
    </EditionProvider>
  );
}
