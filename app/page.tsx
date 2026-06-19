"use client";

import { useMemo, useState } from "react";
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
  const [query, setQuery] = useState("");

  const results = useMemo(
    () => DATASET.filter((item) => fuzzyMatch(query, item)),
    [query],
  );

  return (
    <Shell>
      <Shell.Edge side="left">
        <Shell.Slot
          id="hello"
          handle={
            <span aria-hidden className="text-lg leading-none">
              👍
            </span>
          }
          handleLabel="Open hello"
        >
          <div className="w-full flex items-center justify-end  bg-red-50">
            <div>hello</div>
          </div>
        </Shell.Slot>
      </Shell.Edge>
      <Shell.Edge side="bottom">
        <Shell.Slot
          id="search"
          handle={
            <span aria-hidden className="text-lg leading-none">
              ⌕
            </span>
          }
          handleLabel="Open search"
        >
          <SearchSlot
            query={query}
            onQueryChange={setQuery}
            results={results}
            placeholder="Search fruit…"
            label="Search fruit"
          />
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
