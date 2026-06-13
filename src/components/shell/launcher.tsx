"use client";

import { useEffect, useMemo, useState } from "react";
import { resolveLinkImageUrl, resolveLinkTitle } from "@/link-display/link-display";
import type { Library, Link } from "@/library/types";
import {
  resolveEdgeGroupLinks,
  resolveEdgeGroupName,
  resolveWorkspacePlacedLinks,
} from "@/placement/placement";
import { filterLinks } from "@/search/search";
import { useLauncherStore } from "@/store/launcher-store";

type LauncherProps = {
  library: Library;
};

function LauncherLinkCard({ link }: { link: Link }) {
  const title = resolveLinkTitle(link);
  const imageUrl = resolveLinkImageUrl(link);

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="shell-launcher-card"
      title={title}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" width={40} height={40} className="shell-image rounded-lg" />
      ) : (
        <span className="shell-launcher-card-glyph" aria-hidden />
      )}
      <span className="shell-launcher-card-title">{title}</span>
    </a>
  );
}

export function Launcher({ library }: LauncherProps) {
  const { open, edge, edgeGroupId, showFullCatalog, close, toggleCatalog } = useLauncherStore();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, close]);

  const baseLinks = useMemo(() => {
    if (showFullCatalog) {
      return library.catalog;
    }

    if (edge && edgeGroupId) {
      return resolveEdgeGroupLinks(library, edge, edgeGroupId);
    }

    return resolveWorkspacePlacedLinks(library);
  }, [library, edge, edgeGroupId, showFullCatalog]);

  const visibleLinks = useMemo(() => filterLinks(baseLinks, query), [baseLinks, query]);

  if (!open) {
    return null;
  }

  const edgeGroupName =
    edge && edgeGroupId ? resolveEdgeGroupName(library, edge, edgeGroupId) : null;

  const scopeLabel = showFullCatalog ? "Full catalog" : edgeGroupName ? edgeGroupName : "Workspace";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button
        type="button"
        aria-label="Close launcher"
        className="shell-overlay-scrim"
        onClick={close}
      />

      <div role="dialog" aria-modal="true" aria-label="Launcher" className="shell-launcher-dialog">
        <header className="shell-launcher-header">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter links…"
            aria-label="Filter launcher links"
            className="shell-launcher-search"
            autoFocus
          />
          <button
            type="button"
            onClick={toggleCatalog}
            className={`shell-launcher-action${showFullCatalog ? " shell-launcher-action-accent" : ""}`}
          >
            {showFullCatalog ? "Workspace links" : "Full catalog"}
          </button>
          <button type="button" onClick={close} className="shell-launcher-action">
            Close
          </button>
        </header>

        <p className="shell-launcher-meta">
          {scopeLabel} · <span className="tabular-nums">{visibleLinks.length}</span> links
        </p>

        <div className="shell-launcher-grid-wrap">
          <div className="shell-launcher-grid">
            {visibleLinks.map((link) => (
              <LauncherLinkCard key={link.id} link={link} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
