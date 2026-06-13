import { readFileSync, writeFileSync } from "node:fs";

const workerPath = new URL("../.open-next/worker.js", import.meta.url);

const originalImport = `            // @ts-expect-error: resolved by wrangler build
            const { handler } = await import("./server-functions/default/handler.mjs");
            return handler(reqOrResp, env, ctx, request.signal);`;

const waitLoopImport = `            // @ts-expect-error: resolved by wrangler build
            const server = await import("./server-functions/default/handler.mjs");
            let handler = server.handler;
            let attempts = 0;
            while (typeof handler !== "function" && attempts < 200) {
              await new Promise((resolve) => setTimeout(resolve, 0));
              handler = server.handler;
              attempts += 1;
            }
            if (typeof handler !== "function") {
              throw new TypeError("OpenNext handler failed to initialize");
            }
            return handler(reqOrResp, env, ctx, request.signal);`;

const modulePreloadImport = `const serverHandlerModule = import("./server-functions/default/handler.mjs");

export default {`;

const patchedFetch = `            const { handler } = await serverHandlerModule;
            return handler(reqOrResp, env, ctx, request.signal);`;

let worker = readFileSync(workerPath, "utf8");

if (worker.includes("serverHandlerModule")) {
  console.log("patch-opennext-worker: already patched");
} else {
  if (worker.includes(waitLoopImport)) {
    worker = worker.replace(waitLoopImport, originalImport);
  }

  if (!worker.includes(originalImport)) {
    throw new Error(
      "patch-opennext-worker: expected import block not found — OpenNext template may have changed",
    );
  }

  worker = worker.replace("export default {", modulePreloadImport);
  worker = worker.replace(originalImport, patchedFetch);
  writeFileSync(workerPath, worker);
  console.log("patch-opennext-worker: applied module-level handler preload");
}
