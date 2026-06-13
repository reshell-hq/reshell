"use client";

import { useMemo, useState } from "react";
import { useAddCatalogLink, useDeleteCatalogLink, useUpdateCatalogLink } from "@/hooks/use-library";
import { resolveLinkTitle } from "@/link-display/link-display";
import type { Link, Library } from "@/library/types";

type ShellConfigCatalogProps = {
  library: Library;
};

type CatalogFormState = {
  url: string;
  title: string;
  image: string;
};

const EMPTY_FORM: CatalogFormState = {
  url: "",
  title: "",
  image: "",
};

function sortCatalog(links: Link[]): Link[] {
  return [...links].sort((left, right) =>
    resolveLinkTitle(left).localeCompare(resolveLinkTitle(right)),
  );
}

export function ShellConfigCatalog({ library }: ShellConfigCatalogProps) {
  const addCatalogLink = useAddCatalogLink();
  const updateCatalogLink = useUpdateCatalogLink();
  const deleteCatalogLink = useDeleteCatalogLink();
  const [form, setForm] = useState<CatalogFormState>(EMPTY_FORM);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const catalogLinks = useMemo(() => {
    const sorted = sortCatalog(library.catalog);
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return sorted;
    }
    return sorted.filter((link) => {
      const haystack = `${resolveLinkTitle(link)} ${link.url}`.toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [library.catalog, query]);

  function startEdit(link: Link) {
    setEditingLinkId(link.id);
    setShowAddForm(false);
    setForm({
      url: link.url,
      title: link.title ?? "",
      image: link.image ?? "",
    });
  }

  function startAdd() {
    setEditingLinkId(null);
    setShowAddForm(true);
    setForm(EMPTY_FORM);
  }

  function cancelForm() {
    setEditingLinkId(null);
    setShowAddForm(false);
    setForm(EMPTY_FORM);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = form.url.trim();
    if (!url) {
      return;
    }

    const input = {
      url,
      ...(form.title.trim() ? { title: form.title.trim() } : {}),
      ...(form.image.trim() ? { image: form.image.trim() } : {}),
    };

    if (editingLinkId) {
      updateCatalogLink.mutate({ linkId: editingLinkId, patch: input }, { onSuccess: cancelForm });
      return;
    }

    addCatalogLink.mutate(input, { onSuccess: cancelForm });
  }

  function handleDelete(link: Link) {
    const label = resolveLinkTitle(link);
    const confirmed = window.confirm(`Delete "${label}" from the catalog?`);
    if (!confirmed) {
      return;
    }

    deleteCatalogLink.mutate(link.id, {
      onSuccess: () => {
        if (editingLinkId === link.id) {
          cancelForm();
        }
      },
    });
  }

  const formVisible = editingLinkId !== null || showAddForm;

  return (
    <div className="shell-config-dialog-section shell-config-dialog-section-fill">
      <div className="shell-config-split">
        <div className="shell-config-split-pane">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter links…"
            aria-label="Filter catalog links"
            className="shell-config-input"
          />

          <div className="shell-config-dialog-scroll shell-config-dialog-scroll-fill">
            <ul className="shell-config-catalog">
              {catalogLinks.map((link) => (
                <li
                  key={link.id}
                  className={`shell-config-catalog-item${
                    editingLinkId === link.id ? " active" : ""
                  }`}
                >
                  <div className="shell-config-catalog-copy">
                    <span className="shell-config-catalog-title">{resolveLinkTitle(link)}</span>
                    <span className="shell-config-catalog-url">{link.url}</span>
                  </div>
                  <div className="shell-config-catalog-actions">
                    <button
                      type="button"
                      className="shell-config-action"
                      onClick={() => startEdit(link)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="shell-config-action shell-config-action-danger"
                      onClick={() => handleDelete(link)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="shell-config-split-pane shell-config-form-pane">
          {formVisible ? (
            <form className="shell-config-form shell-config-form-panel" onSubmit={handleSubmit}>
              <p className="shell-config-form-label">{editingLinkId ? "Edit link" : "Add link"}</p>
              <input
                type="url"
                required
                value={form.url}
                onChange={(event) =>
                  setForm((current) => ({ ...current, url: event.target.value }))
                }
                placeholder="URL"
                className="shell-config-input"
              />
              <input
                type="text"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Title (optional)"
                className="shell-config-input"
              />
              <input
                type="url"
                value={form.image}
                onChange={(event) =>
                  setForm((current) => ({ ...current, image: event.target.value }))
                }
                placeholder="Image URL (optional)"
                className="shell-config-input"
              />
              <div className="shell-config-form-actions">
                <button type="button" className="shell-config-action" onClick={cancelForm}>
                  Cancel
                </button>
                <button type="submit" className="shell-config-submit">
                  {editingLinkId ? "Save link" : "Add link"}
                </button>
              </div>
            </form>
          ) : (
            <div className="shell-config-form-panel shell-config-form-placeholder">
              <p className="shell-config-dialog-copy">
                Select a link to edit, or add a new catalog entry.
              </p>
              <button type="button" className="shell-config-submit" onClick={startAdd}>
                Add link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
