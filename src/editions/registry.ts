/**
 * Minimal typed registry backing the shell's extension seams (rim tools,
 * command-bar actions). Empty by default; the private compose registers entries
 * at startup before the shell mounts. Entries are keyed by `id`; re-registering
 * an id replaces the previous entry.
 */
export type Registry<T extends { id: string }> = {
  register(entry: T): void;
  unregister(id: string): void;
  get(id: string): T | undefined;
  list(): T[];
  clear(): void;
};

export function createRegistry<T extends { id: string }>(): Registry<T> {
  const entries = new Map<string, T>();

  return {
    register(entry) {
      entries.set(entry.id, entry);
    },
    unregister(id) {
      entries.delete(id);
    },
    get(id) {
      return entries.get(id);
    },
    list() {
      return [...entries.values()];
    },
    clear() {
      entries.clear();
    },
  };
}
