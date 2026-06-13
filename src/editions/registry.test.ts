import { describe, expect, it } from "vitest";
import { createRegistry } from "./registry";

type Entry = { id: string; value: number };

describe("createRegistry", () => {
  it("is empty by default", () => {
    const registry = createRegistry<Entry>();
    expect(registry.list()).toEqual([]);
    expect(registry.get("missing")).toBeUndefined();
  });

  it("registers, gets, and lists entries in insertion order", () => {
    const registry = createRegistry<Entry>();
    registry.register({ id: "a", value: 1 });
    registry.register({ id: "b", value: 2 });

    expect(registry.get("a")).toEqual({ id: "a", value: 1 });
    expect(registry.list().map((entry) => entry.id)).toEqual(["a", "b"]);
  });

  it("replaces an entry when re-registering the same id", () => {
    const registry = createRegistry<Entry>();
    registry.register({ id: "a", value: 1 });
    registry.register({ id: "a", value: 99 });

    expect(registry.list()).toHaveLength(1);
    expect(registry.get("a")?.value).toBe(99);
  });

  it("unregisters and clears", () => {
    const registry = createRegistry<Entry>();
    registry.register({ id: "a", value: 1 });
    registry.register({ id: "b", value: 2 });

    registry.unregister("a");
    expect(registry.get("a")).toBeUndefined();
    expect(registry.list().map((entry) => entry.id)).toEqual(["b"]);

    registry.clear();
    expect(registry.list()).toEqual([]);
  });
});
