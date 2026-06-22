# Plan 015: Icon system + curated animated pack

> **Executor instructions**: Follow step by step, run every verification command, honor STOP conditions, update `plans/README.md` when done. Read the **Conventions** section in `plans/README.md` (commits, modularity, styling) first.
>
> **Drift check (run first)**: `git diff --stat 38ba3a9..HEAD -- lib/icons/ components/personal/` — plan 008 must be DONE.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/008
- **Category**: feature / polish
- **Planned at**: commit `38ba3a9`, 2026-06-21

## Why this matters

Users can already use emoji or image-URL icons (plan 008). This plan ships a curated, on-brand **default icon set** so a fresh config looks great out of the box, using the animated [`@animateicons/react`](https://animateicons.in/) pack (Lucide subpath: tree-shakeable, RSC-ready `"use client"` banners, TypeScript-first). Icons appear in bookmark handles/rows, tool handles, the command center, and command-bar rows.

## Current state

After 008: `lib/icons/` exists as a thin resolver seam returning emoji/image, with named icons falling back to a placeholder. `icon` fields accept a string. shadcn is configured but `components/ui/` may be empty.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Install pack | `npm i @animateicons/react` | added to deps |
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Build | `npm run build` | exit 0 |
| Tests | `npm test` | all pass |
| Lint | `npm run lint` | exit 0 |

## Scope

**In scope:**

- `npm i @animateicons/react`.
- `lib/icons/resolve.ts` (extend from 008) — pure `resolveIcon(value?): IconRef` classifying: emoji (literal, non-URL/non-name) → `{ kind: "emoji" }`; `http(s)://…` → `{ kind: "image" }`; else → `{ kind: "named", name }`. Unit-tested.
- `lib/icons/registry.ts` (create) — maps curated names → an `@animateicons/react/lucide` component. Curate a sensible default set (~30–50) for common bookmarks (github, code, mail, calendar, music, terminal, book, figma, etc.) and reuse for tool/widget glyphs. Tree-shaken via direct named imports; no barrel that pulls all 281.
- `components/icon/icon.tsx` (create) — `<Icon value size? className? animateOnHover? />` rendering the resolved emoji / `<img>` / animated pack component. Pure presentation; respects `prefers-reduced-motion` (the pack already does, but verify).
- Retrofit consumers to use `<Icon>`: bookmark group handles + rows (008), tool slot handles (011–013), command-center entries (009), command-bar rows (010 where present).
- Document available icon names (a short `lib/icons/README.md` or a typed `IconName` union exported for config authoring + editor autocomplete).
- `lib/icons/__tests__/resolve.test.ts` (create).
- `plans/README.md` — status row only.

**Out of scope:**

- A visual icon picker UI (config is hand-edited; the exported `IconName` union gives autocomplete).
- Custom/uploaded icon management beyond image URLs.
- Replacing the shell's own handle visuals (that's the shell primitive's `Handle`).

## Steps

### Step 1: Install + resolver

- Add the package. Finalize `resolveIcon`. Detection order: image URL (cheap regex) → named (matches a registry key) → emoji/literal fallback. Keep it dumb and total (never throws).

**Verify**: `resolve.test.ts` — emoji, https URL, known name, unknown name (fallback), undefined.

### Step 2: Registry + Icon component

- `registry.ts`: `iconByName: Record<IconName, ComponentType<...>>` via direct imports from `@animateicons/react/lucide`. Export `IconName = keyof typeof iconByName`.
- `<Icon>`: switch on resolved kind; named → animated component (hover/`animateOnHover`), emoji → span, image → `<img alt="" loading="lazy">`. Sizes via prop → Tailwind.

**Verify**: a named icon animates on hover; emoji + image still render; reduced-motion disables animation.

### Step 3: Retrofit

- Swap raw icon rendering in bookmarks/tools/command-center/command-bar for `<Icon>`. No behavior change beyond visuals.

### Step 4: Author docs

- Export `IconName` and list the curated names so config authors get autocomplete + a reference.

**Verify**: `npm run dev` — default config (using named icons) looks polished; bundle didn't balloon (only curated icons imported); emoji/image overrides still win.

## Commits (Conventional Commits — commit per atomic change)

- `build(icons): add @animateicons/react dependency`
- `feat(icons): resolve emoji | image | named icon refs`
- `test(icons): cover icon resolution`
- `feat(icons): add curated animated icon registry and <Icon> component`
- `refactor(bookmarks): render icons via <Icon>` (and similar per consumer area)
- `docs(icons): export IconName union and curated reference`

## Modularity & styling

- `lib/icons/resolve.ts` + `registry.ts` are pure/import-only and exported via `lib/icons/index.ts`. `<Icon>` is a standalone, app-decoupled component (the paid tiers reuse it).
- Curate via **direct named imports** so tree-shaking keeps the bundle small — never import the whole pack.
- Styling stays utility-class based; any keyframe tweaks go in a colocated module, not `globals.css`.

## Test plan

- Unit: `resolve.test.ts`.
- Manual: hover animation, reduced-motion, three icon kinds, bundle size sanity.

## Done criteria

- [ ] `@animateicons/react` installed; curated registry + `<Icon>` component.
- [ ] `resolveIcon` handles emoji/image/named (+ fallback), unit-tested.
- [ ] Bookmarks/tools/command-center/command-bar render via `<Icon>`; user emoji/image overrides still work.
- [ ] `IconName` union exported + documented for config authoring.
- [ ] Tree-shaking verified (no full-pack import); reduced-motion respected.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run build`, `npm run lint` exit 0.
- [ ] `plans/README.md` row 015 → DONE.

## Skill passes (see README → Skill workflow)

- **improve**: `improve review-plan plans/015-icon-system.md` before starting.
- **impeccable**: `impeccable polish "icons"` / `impeccable animate "icon hover"` before the final commit — curate a set that matches `DESIGN.md`'s aesthetic, ensure motion is tasteful and `prefers-reduced-motion`-safe, and icon sizing/optical alignment is consistent across handles/rows.
- **ponytail (full)**: `resolveIcon` is a small total function (no icon "framework"). Use the existing pack via direct named imports; do not vendor or wrap it beyond `<Icon>`. Pre-commit: `ponytail-review` the diff.

## STOP conditions

- The pack pulls all 281 icons into the bundle despite curation — STOP and fix the import strategy (or vendor only the needed icons); bundle bloat is a regression.
- The pack's `"use client"` / Motion deps break the Next 16 build — STOP, consult `node_modules/next/dist/docs/`, and report.

## Maintenance notes

- Adding a default icon = one named import + one registry entry + one `IconName` member.
- Keep `<Icon>` the single render path so emoji/image/named precedence stays consistent everywhere.
