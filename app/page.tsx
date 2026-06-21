import Link from "next/link";

/**
 * Slim OSS root stub. The marketing landing lives on reshell.xyz; the public
 * repo's `/` is a thin entry that points at the real surfaces. Real content is
 * the home station (`/home`) and the start page (`/start`).
 */
export default function RootPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Reshell</h1>
        <p className="max-w-md text-muted-foreground">
          A productivity shell for developers. Self-host the Personal edition.
        </p>
      </div>
      <nav className="flex flex-wrap items-center justify-center gap-4 text-sm">
        <Link className="underline underline-offset-4" href="/home">
          Home station
        </Link>
        <Link className="underline underline-offset-4" href="/start">
          Start page
        </Link>
        <Link className="underline underline-offset-4" href="/dev">
          Shell playground
        </Link>
      </nav>
    </main>
  );
}
