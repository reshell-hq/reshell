"use client";

import { useEffect, useMemo, useState } from "react";
import {
  computeMaxEdgeSlotCount,
  insertIndexToSlotIndex,
  slotIndexToInsertIndex,
} from "@/edge-slots/edge-slots";
import { useEdgeLengthPx } from "@/hooks/use-edge-length";
import { useMutateLibrary } from "@/hooks/use-library";
import { resolveLinkTitle } from "@/link-display/link-display";
import type { EdgeGroup, EdgePosition, Library } from "@/library/types";
import {
  addEdgeGroup,
  addLinkToEdgeGroup,
  deleteEdgeGroup,
  moveLinkInEdgeGroup,
  removeLinkFromEdgeGroup,
  updateEdgeGroup,
} from "@/placement/placement-mutations";
import {
  reorderEdgeGroupOnRim,
  resolveEdgeGroupLinks,
  resolveEdgeGroups,
} from "@/placement/placement";
import { ShellConfigLinkPicker } from "./shell-config-link-picker";

const EDGES: EdgePosition[] = ["left", "top", "bottom"];

type ShellConfigPlacementsProps = {
  library: Library;
};

type GroupFormState = {
  name: string;
  handleIcon: string;
};

const EMPTY_GROUP_FORM: GroupFormState = {
  name: "",
  handleIcon: "",
};

function groupAtSlot(
  slotIndex: number,
  groups: readonly EdgeGroup[],
  maxSlots: number,
): EdgeGroup | null {
  for (let index = 0; index < groups.length; index++) {
    if (insertIndexToSlotIndex(index, groups.length, maxSlots) === slotIndex) {
      return groups[index];
    }
  }

  return null;
}

export function ShellConfigPlacements({ library }: ShellConfigPlacementsProps) {
  const mutateLibrary = useMutateLibrary();
  const workspaceId = library.activeWorkspaceId;
  const [edge, setEdge] = useState<EdgePosition>("left");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState<GroupFormState>(EMPTY_GROUP_FORM);
  const [newGroupForm, setNewGroupForm] = useState<GroupFormState>(EMPTY_GROUP_FORM);
  const [linkToAdd, setLinkToAdd] = useState("");
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const edgeLengthPx = useEdgeLengthPx(edge);

  const groups = useMemo(() => resolveEdgeGroups(library, edge), [library, edge]);
  const maxSlots = useMemo(() => computeMaxEdgeSlotCount(edgeLengthPx), [edgeLengthPx]);
  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? groups[0] ?? null;
  const groupLinks = selectedGroup ? resolveEdgeGroupLinks(library, edge, selectedGroup.id) : [];

  useEffect(() => {
    if (groups.length === 0) {
      setSelectedGroupId(null);
      return;
    }
    if (!selectedGroupId || !groups.some((group) => group.id === selectedGroupId)) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  useEffect(() => {
    if (!selectedGroup) {
      setGroupForm(EMPTY_GROUP_FORM);
      return;
    }
    setGroupForm({
      name: selectedGroup.name,
      handleIcon: selectedGroup.handleIcon ?? "",
    });
  }, [selectedGroup]);

  function saveGroupDetails(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedGroup) {
      return;
    }
    const name = groupForm.name.trim();
    if (!name) {
      return;
    }

    mutateLibrary.mutate((current) =>
      updateEdgeGroup(current, workspaceId, edge, selectedGroup.id, {
        name,
        handleIcon: groupForm.handleIcon.trim(),
      }),
    );
  }

  function handleAddGroup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newGroupForm.name.trim();
    if (!name) {
      return;
    }

    mutateLibrary.mutate(
      (current) =>
        addEdgeGroup(current, workspaceId, edge, {
          name,
          ...(newGroupForm.handleIcon.trim() ? { handleIcon: newGroupForm.handleIcon.trim() } : {}),
        }),
      {
        onSuccess: (updated) => {
          const created = resolveEdgeGroups(updated, edge).find((group) => group.name === name);
          if (created) {
            setSelectedGroupId(created.id);
          }
        },
      },
    );
    setNewGroupForm(EMPTY_GROUP_FORM);
    setShowNewGroupForm(false);
  }

  function handleDeleteGroup() {
    if (!selectedGroup) {
      return;
    }
    const confirmed = window.confirm(`Delete edge group "${selectedGroup.name}"?`);
    if (!confirmed) {
      return;
    }
    mutateLibrary.mutate((current) =>
      deleteEdgeGroup(current, workspaceId, edge, selectedGroup.id),
    );
  }

  function handleMoveGroupToSlot(slotIndex: number) {
    if (!selectedGroup) {
      return;
    }
    const insertIndex = slotIndexToInsertIndex(slotIndex, groups.length, maxSlots);
    mutateLibrary.mutate((current) =>
      reorderEdgeGroupOnRim(current, edge, selectedGroup.id, insertIndex),
    );
  }

  function handleAddLinkToGroup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedGroup || !linkToAdd) {
      return;
    }
    mutateLibrary.mutate((current) =>
      addLinkToEdgeGroup(current, workspaceId, edge, selectedGroup.id, linkToAdd),
    );
    setLinkToAdd("");
  }

  function handleRemoveLinkFromGroup(linkId: string) {
    if (!selectedGroup) {
      return;
    }
    mutateLibrary.mutate((current) =>
      removeLinkFromEdgeGroup(current, workspaceId, edge, selectedGroup.id, linkId),
    );
  }

  function handleMoveLink(linkId: string, targetIndex: number) {
    if (!selectedGroup) {
      return;
    }
    mutateLibrary.mutate((current) =>
      moveLinkInEdgeGroup(current, workspaceId, edge, selectedGroup.id, linkId, targetIndex),
    );
  }

  const catalogOptions = useMemo(
    () =>
      [...library.catalog].sort((left, right) =>
        resolveLinkTitle(left).localeCompare(resolveLinkTitle(right)),
      ),
    [library.catalog],
  );

  const currentGroupSlotIndex = selectedGroup
    ? insertIndexToSlotIndex(
        groups.findIndex((group) => group.id === selectedGroup.id),
        groups.length,
        maxSlots,
      )
    : -1;

  return (
    <div className="shell-config-dialog-section shell-config-dialog-section-fill">
      <div className="shell-config-edge-tabs" role="tablist" aria-label="Edge">
        {EDGES.map((edgeName) => (
          <button
            key={edgeName}
            type="button"
            role="tab"
            aria-selected={edge === edgeName}
            className={`shell-config-edge-tab${edge === edgeName ? " active" : ""}`}
            onClick={() => setEdge(edgeName)}
          >
            {edgeName}
          </button>
        ))}
      </div>

      <div className="shell-config-placements-grid">
        <aside className="shell-config-placements-sidebar">
          {groups.length > 0 ? (
            <ul className="shell-config-group-list">
              {groups.map((group) => (
                <li key={group.id}>
                  <button
                    type="button"
                    className={`shell-config-group-select${
                      selectedGroup?.id === group.id ? " active" : ""
                    }`}
                    onClick={() => setSelectedGroupId(group.id)}
                  >
                    <span>{group.handleIcon ?? "•"}</span>
                    <span>{group.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="shell-config-empty">No groups on this edge yet.</p>
          )}

          {showNewGroupForm ? (
            <form className="shell-config-form" onSubmit={handleAddGroup}>
              <p className="shell-config-form-label">New edge group</p>
              <input
                type="text"
                required
                value={newGroupForm.name}
                onChange={(event) =>
                  setNewGroupForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Group name"
                className="shell-config-input"
              />
              <input
                type="text"
                value={newGroupForm.handleIcon}
                onChange={(event) =>
                  setNewGroupForm((current) => ({
                    ...current,
                    handleIcon: event.target.value,
                  }))
                }
                placeholder="Handle icon (optional)"
                className="shell-config-input"
              />
              <div className="shell-config-form-actions">
                <button
                  type="button"
                  className="shell-config-action"
                  onClick={() => {
                    setShowNewGroupForm(false);
                    setNewGroupForm(EMPTY_GROUP_FORM);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="shell-config-submit">
                  Add group
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              className="shell-config-add-button"
              onClick={() => setShowNewGroupForm(true)}
            >
              + New edge group
            </button>
          )}
        </aside>

        <div className="shell-config-placements-editor">
          {selectedGroup ? (
            <>
              <form className="shell-config-form" onSubmit={saveGroupDetails}>
                <p className="shell-config-form-label">Group details</p>
                <input
                  type="text"
                  required
                  value={groupForm.name}
                  onChange={(event) =>
                    setGroupForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Group name"
                  className="shell-config-input"
                />
                <input
                  type="text"
                  value={groupForm.handleIcon}
                  onChange={(event) =>
                    setGroupForm((current) => ({
                      ...current,
                      handleIcon: event.target.value,
                    }))
                  }
                  placeholder="Handle icon (emoji or image URL)"
                  className="shell-config-input"
                />
                <div className="shell-config-form-actions">
                  <button type="submit" className="shell-config-submit">
                    Save group
                  </button>
                  <button
                    type="button"
                    className="shell-config-action shell-config-action-danger"
                    onClick={handleDeleteGroup}
                  >
                    Delete
                  </button>
                </div>
              </form>

              <div className="shell-config-slot-rail">
                <p className="shell-config-form-label">
                  Slot rail{" "}
                  <span className="shell-config-slot-count tabular-nums">({maxSlots})</span>
                </p>
                <div className="shell-config-slot-buttons">
                  {Array.from({ length: maxSlots }, (_, slotIndex) => {
                    const occupant = groupAtSlot(slotIndex, groups, maxSlots);
                    const isActive = currentGroupSlotIndex === slotIndex;
                    const label = occupant
                      ? (occupant.handleIcon ?? occupant.name.slice(0, 2))
                      : String(slotIndex + 1);

                    return (
                      <button
                        key={slotIndex}
                        type="button"
                        className={`shell-config-slot${
                          isActive ? " active" : ""
                        }${occupant ? " occupied" : " empty"}`}
                        title={
                          occupant
                            ? `${occupant.name} — slot ${slotIndex + 1}`
                            : `Empty slot ${slotIndex + 1}`
                        }
                        aria-label={
                          occupant
                            ? `Move ${selectedGroup.name} to slot ${slotIndex + 1} (${occupant.name})`
                            : `Move ${selectedGroup.name} to slot ${slotIndex + 1}`
                        }
                        onClick={() => handleMoveGroupToSlot(slotIndex)}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="shell-config-dialog-scroll shell-config-dialog-scroll-compact">
                <ul className="shell-config-catalog">
                  {groupLinks.map((link, index) => (
                    <li key={link.id} className="shell-config-catalog-item">
                      <div className="shell-config-catalog-copy">
                        <span className="shell-config-catalog-title">{resolveLinkTitle(link)}</span>
                      </div>
                      <div className="shell-config-catalog-actions">
                        <button
                          type="button"
                          className="shell-config-action"
                          disabled={index === 0}
                          onClick={() => handleMoveLink(link.id, index - 1)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="shell-config-action"
                          disabled={index === groupLinks.length - 1}
                          onClick={() => handleMoveLink(link.id, index + 1)}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="shell-config-action shell-config-action-danger"
                          onClick={() => handleRemoveLinkFromGroup(link.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <form className="shell-config-form" onSubmit={handleAddLinkToGroup}>
                <p className="shell-config-form-label">Add link to group</p>
                <ShellConfigLinkPicker
                  links={catalogOptions}
                  value={linkToAdd}
                  onChange={setLinkToAdd}
                />
                <button type="submit" className="shell-config-submit" disabled={!linkToAdd}>
                  Add to group
                </button>
              </form>
            </>
          ) : (
            <p className="shell-config-empty">
              Create an edge group to edit placements on this rim.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
