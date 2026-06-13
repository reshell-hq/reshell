import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));

export const START_PAGE_ENTRY = "src/app/start/page.tsx";
export const HOME_STATION_ENTRY = "src/app/home/page.tsx";

/** Modules that belong to the full shell and must not appear on /start. */
export const SHELL_ONLY_MODULES = [
  "src/components/shell/shell.tsx",
  "src/components/shell/shell-canvas.tsx",
  "src/components/shell/shell-edge-layer.tsx",
  "src/components/shell/shell-config-dialog.tsx",
  "src/components/shell/launcher.tsx",
  "src/components/shell/shell-dashboard.tsx",
  "src/components/shell/canvas-widget-stack.tsx",
  "src/shell-frame/",
] as const;

const IMPORT_PATTERN = /from\s+["']([^"']+)["']/g;

function normalizeRepoPath(absolutePath: string): string {
  return absolutePath.slice(PROJECT_ROOT.length + 1);
}

function resolveImport(fromFile: string, specifier: string): string | null {
  const candidates: string[] = [];

  if (specifier.startsWith("@/")) {
    const rel = specifier.slice(2);
    candidates.push(
      join(PROJECT_ROOT, "src", `${rel}.ts`),
      join(PROJECT_ROOT, "src", `${rel}.tsx`),
      join(PROJECT_ROOT, "src", rel, "index.ts"),
      join(PROJECT_ROOT, "src", rel, "index.tsx"),
    );
  } else if (specifier.startsWith(".")) {
    const fromDir = dirname(join(PROJECT_ROOT, fromFile));
    const resolved = resolve(fromDir, specifier);
    candidates.push(
      `${resolved}.ts`,
      `${resolved}.tsx`,
      join(resolved, "index.ts"),
      join(resolved, "index.tsx"),
    );
  } else {
    return null;
  }

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return normalizeRepoPath(candidate);
    }
  }

  return null;
}

export function collectTransitiveImports(entryFile: string): Set<string> {
  const visited = new Set<string>();
  const queue = [entryFile];

  while (queue.length > 0) {
    const file = queue.shift();
    if (!file || visited.has(file)) {
      continue;
    }

    visited.add(file);

    const absolutePath = join(PROJECT_ROOT, file);
    if (!existsSync(absolutePath)) {
      continue;
    }

    const content = readFileSync(absolutePath, "utf8");
    for (const match of content.matchAll(IMPORT_PATTERN)) {
      const resolved = resolveImport(file, match[1]);
      if (resolved && !visited.has(resolved)) {
        queue.push(resolved);
      }
    }
  }

  return visited;
}

export function importsShellOnlyModules(files: Iterable<string>): string[] {
  const fileList = [...files];
  return fileList.filter((file) =>
    SHELL_ONLY_MODULES.some(
      (shellModule) =>
        file === shellModule || (shellModule.endsWith("/") && file.startsWith(shellModule)),
    ),
  );
}
