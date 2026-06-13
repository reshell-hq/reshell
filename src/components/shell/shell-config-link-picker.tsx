"use client";

import { useMemo, useState } from "react";
import { resolveLinkTitle } from "@/link-display/link-display";
import type { Link } from "@/library/types";

type ShellConfigLinkPickerProps = {
  links: Link[];
  excludeIds?: ReadonlySet<string>;
  value: string;
  onChange: (linkId: string) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
};

export function ShellConfigLinkPicker({
  links,
  excludeIds,
  value,
  onChange,
  searchPlaceholder = "Search catalog links…",
  emptyMessage = "No matching links.",
}: ShellConfigLinkPickerProps) {
  const [query, setQuery] = useState("");

  const options = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return links
      .filter((link) => !excludeIds?.has(link.id))
      .filter((link) => {
        if (!trimmed) {
          return true;
        }
        const haystack = `${resolveLinkTitle(link)} ${link.url}`.toLowerCase();
        return haystack.includes(trimmed);
      });
  }, [excludeIds, links, query]);

  return (
    <div className="shell-config-link-picker">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={searchPlaceholder}
        aria-label="Search catalog links"
        className="shell-config-input"
      />
      <ul className="shell-config-link-picker-list" role="listbox" aria-label="Catalog links">
        {options.length === 0 ? (
          <li className="shell-config-link-picker-empty">{emptyMessage}</li>
        ) : (
          options.map((link) => (
            <li key={link.id}>
              <button
                type="button"
                role="option"
                aria-selected={value === link.id}
                className={`shell-config-link-picker-item${value === link.id ? " active" : ""}`}
                onClick={() => onChange(link.id)}
              >
                <span className="shell-config-catalog-title">{resolveLinkTitle(link)}</span>
                <span className="shell-config-catalog-url">{link.url}</span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
