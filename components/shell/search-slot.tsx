"use client";

type SearchSlotProps = {
  query: string;
  onQueryChange: (value: string) => void;
  results: string[];
  loading?: boolean;
  placeholder?: string;
  label?: string;
};

/**
 * Presentational search panel designed for Shell.Slot. Rendered in two places
 * (offscreen measurer + portal), so state MUST live in the parent to stay in
 * sync. Drives the notch via ResizeObserver on the measurer copy.
 */
export function SearchSlot({
  query,
  onQueryChange,
  results,
  loading = false,
  placeholder = "Search…",
  label = "Search",
}: SearchSlotProps) {
  return (
    <div className="flex w-80 flex-col-reverse gap-2 p-3 text-zinc-900 dark:text-zinc-50">
      <input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        aria-label={label}
        placeholder={placeholder}
        className="w-full shrink-0 rounded-md border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950"
      />
      {query.trim() === "" ? null : results.length > 0 ? (
        <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
          {results.map((item) => (
            <li
              key={item}
              className="rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-800"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-2 py-1 text-sm text-zinc-500" role="status">
          {loading ? "Searching…" : "No matches"}
        </p>
      )}
    </div>
  );
}
