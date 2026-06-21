/**
 * Start page (`/start`) — lightweight new-tab surface reading the same
 * IndexedDB library as the home station. Stub for now; built in issue 13.
 */
export default function StartPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Start page</h1>
      <p className="max-w-md text-muted-foreground">
        Search-and-launch new-tab surface. Built in personal-edition-rewrite
        issue 13.
      </p>
    </main>
  );
}
