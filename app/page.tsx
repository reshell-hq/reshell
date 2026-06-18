"use client";

import { useCallback } from "react";
import { Shell } from "@/components/shell";
import { SearchSlot } from "@/components/shell/search-slot";

const DATASET = [
  "Apple",
  "Apricot",
  "Avocado",
  "Banana",
  "Blackberry",
  "Blueberry",
  "Cantaloupe",
  "Cherry",
  "Coconut",
  "Cranberry",
  "Date",
  "Dragonfruit",
  "Elderberry",
  "Fig",
  "Grape",
  "Grapefruit",
  "Guava",
  "Honeydew",
  "Kiwi",
  "Lemon",
  "Lime",
  "Mango",
  "Nectarine",
  "Orange",
  "Papaya",
  "Peach",
  "Pear",
  "Pineapple",
  "Plum",
  "Pomegranate",
  "Raspberry",
  "Strawberry",
  "Tangerine",
  "Watermelon",
];

function fuzzyMatch(query: string, value: string): boolean {
  const needle = query.toLowerCase().trim();
  if (needle === "") {
    return true;
  }

  const haystack = value.toLowerCase();
  let index = 0;
  for (const char of needle) {
    index = haystack.indexOf(char, index);
    if (index === -1) {
      return false;
    }
    index += 1;
  }

  return true;
}

export default function Home() {
  const search = useCallback(async (query: string): Promise<string[]> => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return DATASET.filter((item) => fuzzyMatch(query, item));
  }, []);

  return (
    <Shell>
      <Shell.Edge side="bottom">
        <Shell.Slot
          id="search"
          handle={<span aria-hidden className="text-lg leading-none">⌕</span>}
          handleLabel="Open search"
        >
          <SearchSlot onSearch={search} placeholder="Search fruit…" label="Search fruit" />
        </Shell.Slot>
      </Shell.Edge>
      <Shell.Content>
        <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">reshell</h1>
          <p className="max-w-md text-zinc-500">
            Hover the handle at the bottom edge to open the search slot. Results
            load asynchronously and grow the notch upward.
          </p>
        </main>
      </Shell.Content>
    </Shell>
  );
}
