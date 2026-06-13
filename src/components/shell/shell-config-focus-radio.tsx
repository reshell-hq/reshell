"use client";

import { useState } from "react";
import {
  addFocusRadioStation,
  listFocusRadioStations,
  moveFocusRadioStation,
  removeFocusRadioStation,
  updateFocusRadioStation,
} from "@/focus-radio/stations";
import type { FocusRadioStationKind } from "@/focus-radio/types";
import { useMutateLibrary } from "@/hooks/use-library";
import type { Library } from "@/library/types";

type StationFormState = {
  label: string;
  url: string;
  kind: FocusRadioStationKind;
  imageUrl: string;
  description: string;
  favorite: boolean;
};

const EMPTY_FORM: StationFormState = {
  label: "",
  url: "",
  kind: "stream",
  imageUrl: "",
  description: "",
  favorite: false,
};

type ShellConfigFocusRadioProps = {
  library: Library;
};

export function ShellConfigFocusRadio({ library }: ShellConfigFocusRadioProps) {
  const mutateLibrary = useMutateLibrary();
  const stations = listFocusRadioStations(library);
  const [form, setForm] = useState<StationFormState>(EMPTY_FORM);
  const [editingStationId, setEditingStationId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  function startAdd() {
    setEditingStationId(null);
    setShowAddForm(true);
    setForm(EMPTY_FORM);
  }

  function startEdit(stationId: string) {
    const station = stations.find((entry) => entry.id === stationId);
    if (!station) {
      return;
    }

    setEditingStationId(stationId);
    setShowAddForm(false);
    setForm({
      label: station.label,
      url: station.url,
      kind: station.kind,
      imageUrl: station.imageUrl ?? "",
      description: station.description ?? "",
      favorite: station.favorite ?? false,
    });
  }

  function cancelForm() {
    setEditingStationId(null);
    setShowAddForm(false);
    setForm(EMPTY_FORM);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    mutateLibrary.mutate((current) => {
      if (editingStationId) {
        return updateFocusRadioStation(current, editingStationId, {
          label: form.label,
          url: form.url,
          kind: form.kind,
          imageUrl: form.imageUrl || null,
          description: form.description || null,
          favorite: form.favorite,
        });
      }

      return addFocusRadioStation(current, {
        label: form.label,
        url: form.url,
        kind: form.kind,
        imageUrl: form.imageUrl || undefined,
        description: form.description || undefined,
        favorite: form.favorite,
      });
    });

    cancelForm();
  }

  function handleRemove(stationId: string) {
    mutateLibrary.mutate((current) => removeFocusRadioStation(current, stationId));
    if (editingStationId === stationId) {
      cancelForm();
    }
  }

  function handleMove(stationId: string, direction: "up" | "down") {
    const index = stations.findIndex((station) => station.id === stationId);
    if (index === -1) {
      return;
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    mutateLibrary.mutate((current) => moveFocusRadioStation(current, stationId, targetIndex));
  }

  return (
    <div className="shell-config-dialog-section">
      <p className="shell-config-dialog-copy">
        Add personal stream or YouTube stations for the control center media tab.
      </p>

      <ul className="shell-config-catalog">
        {stations.map((station, index) => (
          <li key={station.id} className="shell-config-catalog-item">
            <div className="shell-config-catalog-copy">
              <span className="shell-config-catalog-title">{station.label}</span>
              <span className="shell-config-catalog-url">
                {station.kind} · {station.url}
              </span>
            </div>
            <div className="shell-config-catalog-actions">
              <button
                type="button"
                className="shell-config-action"
                disabled={index === 0}
                onClick={() => handleMove(station.id, "up")}
              >
                Up
              </button>
              <button
                type="button"
                className="shell-config-action"
                disabled={index === stations.length - 1}
                onClick={() => handleMove(station.id, "down")}
              >
                Down
              </button>
              <button
                type="button"
                className="shell-config-action"
                onClick={() => startEdit(station.id)}
              >
                Edit
              </button>
              <button
                type="button"
                className="shell-config-action"
                onClick={() => handleRemove(station.id)}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      {showAddForm || editingStationId ? (
        <form className="shell-config-form" onSubmit={handleSubmit}>
          <p className="shell-config-form-label">
            {editingStationId ? "Edit station" : "New station"}
          </p>
          <input
            type="text"
            value={form.label}
            onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
            placeholder="Station label"
            className="shell-config-input"
            aria-label="Station label"
          />
          <input
            type="url"
            value={form.url}
            onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
            placeholder="Stream or YouTube URL"
            className="shell-config-input"
            aria-label="Station URL"
          />
          <label className="shell-config-form-label">
            Kind
            <select
              value={form.kind}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  kind: event.target.value as FocusRadioStationKind,
                }))
              }
              className="shell-config-input"
            >
              <option value="stream">Stream</option>
              <option value="youtube">YouTube</option>
            </select>
          </label>
          <input
            type="url"
            value={form.imageUrl}
            onChange={(event) =>
              setForm((current) => ({ ...current, imageUrl: event.target.value }))
            }
            placeholder="Optional image URL"
            className="shell-config-input"
            aria-label="Station image URL"
          />
          <input
            type="text"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="Optional description"
            className="shell-config-input"
            aria-label="Station description"
          />
          <label className="shell-config-toggle-row">
            <input
              type="checkbox"
              checked={form.favorite}
              onChange={(event) =>
                setForm((current) => ({ ...current, favorite: event.target.checked }))
              }
            />
            <span className="shell-config-catalog-title">Favorite</span>
          </label>
          <div className="shell-config-form-actions">
            <button
              type="submit"
              className="shell-config-submit"
              disabled={!form.label.trim() || !form.url.trim()}
            >
              {editingStationId ? "Save station" : "Add station"}
            </button>
            <button type="button" className="shell-config-action" onClick={cancelForm}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="shell-config-submit" onClick={startAdd}>
          Add station
        </button>
      )}
    </div>
  );
}
