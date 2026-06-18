"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Shell } from "@/components/shell";

const DATASET = [
  "Apple",
  "Apricot",
  "Avocado",
  "Banana",
  "Blackberry",
  "Blueberry",
  "Cantaloupe",
  "Cherry",
  "Clementine",
  "Coconut",
  "Cranberry",
  "Date",
  "Dragonfruit",
  "Elderberry",
  "Fig",
  "Gooseberry",
  "Grape",
  "Grapefruit",
  "Guava",
  "Honeydew",
  "Jackfruit",
  "Kiwi",
  "Lemon",
  "Lime",
  "Lychee",
  "Mango",
  "Mulberry",
  "Nectarine",
  "Orange",
  "Papaya",
  "Passionfruit",
  "Peach",
  "Pear",
  "Persimmon",
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

function SearchPanel({
  query,
  onQueryChange,
  results,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  results: string[];
}) {
  return (
    <div className="flex w-80 flex-col-reverse gap-2 p-3 text-black dark:bg-zinc-900 dark:text-zinc-50">
      <input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        className="w-full shrink-0 rounded border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950"
        placeholder="Search fruit…"
      />
      {results.length > 0 ? (
        <ul className="max-h-[40vh] space-y-1 overflow-y-auto text-sm">
          {results.map((item) => (
            <li
              key={item}
              className="rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-800"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-2 py-1 text-sm text-zinc-500">No matches</p>
      )}
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");

  const results = useMemo(
    () => DATASET.filter((item) => fuzzyMatch(query, item)),
    [query],
  );

  return (
    <Shell>
      <Shell.Edge side="bottom">
        <Shell.Slot id="search">
          <SearchPanel
            query={query}
            onQueryChange={setQuery}
            results={results}
          />
        </Shell.Slot>
      </Shell.Edge>
      <Shell.Content>
        <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
          <main className="flex w-full max-w-3xl flex-1 flex-col items-center justify-between bg-white px-16 py-32 dark:bg-black sm:items-start">
            <Image
              className="dark:invert"
              src="/next.svg"
              alt="Next.js logo"
              width={100}
              height={20}
              priority
            />
            <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
              <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
                To get started, edit the page.tsx file.
              </h1>
              <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
                Looking for a starting point or more instructions? Head over to{" "}
                <a
                  href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                  className="font-medium text-zinc-950 dark:text-zinc-50"
                >
                  Templates
                </a>{" "}
                or the{" "}
                <a
                  href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                  className="font-medium text-zinc-950 dark:text-zinc-50"
                >
                  Learning
                </a>{" "}
                center.
              </p>
            </div>
            <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
              <a
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
                href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  className="dark:invert"
                  src="/vercel.svg"
                  alt="Vercel logomark"
                  width={16}
                  height={16}
                />
                Deploy Now
              </a>
              <a
                className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
                href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                target="_blank"
                rel="noopener noreferrer"
              >
                Documentation
              </a>
            </div>
          </main>
        </div>
      </Shell.Content>
    </Shell>
  );
}
