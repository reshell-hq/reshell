import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Preloading routes on cold start increases CPU time on Workers.
  routePreloadingBehavior: "none",
});
