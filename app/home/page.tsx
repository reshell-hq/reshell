/**
 * Home station (`/home`) — the full shell pinned tab. Stub for now; the real
 * shell (themed by the active workspace, reading the IndexedDB library, with
 * edge groups / command bar / control center / internal tools) is built up
 * across the personal-edition-rewrite slices, starting at issue 04.
 */
export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Home station</h1>
      <p className="max-w-md text-muted-foreground">
        The shell lands here. See <code>.scratch/personal-edition-rewrite</code>{" "}
        (issue 04 onward).
      </p>
    </main>
  );
}
