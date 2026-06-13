import type { Library } from "./types";

export const LIBRARY_SCHEMA_VERSION = 2;

export class StaleLibraryError extends Error {
  constructor() {
    super(
      "This library was saved before the current theme format. Reset the library or import a current snapshot.",
    );
    this.name = "StaleLibraryError";
  }
}

export function isCurrentLibrarySchema(library: Library): boolean {
  return library.schemaVersion === LIBRARY_SCHEMA_VERSION;
}

export function assertCurrentLibrarySchema(library: Library): void {
  if (!isCurrentLibrarySchema(library)) {
    throw new StaleLibraryError();
  }
}
