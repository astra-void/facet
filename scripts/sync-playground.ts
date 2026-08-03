import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { FacetConfig } from "../packages/tools/cli/src/core/config.js";
import { destinationFor } from "../packages/tools/cli/src/core/registry/destination.js";
import { rewriteImports } from "../packages/tools/cli/src/core/transform/rewriteImports.js";
import registry from "../registry/registry";

/**
 * Copies every registry component into the playground the way `facet add` will:
 * same destination rules, same `~/` rewriting. The playground is a consumer, not
 * a second home for the sources — which is what keeps `rootDir` honest and makes
 * a rewriting bug show up here rather than in someone's project.
 *
 * Delete this once `facet add` can be pointed at the playground instead.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = path.join(ROOT, "registry", "src");
const PLAYGROUND = path.join(ROOT, "apps", "playground");

// No `import` specifiers: the playground has no tsconfig `paths`, so this also
// exercises `rewriteImports`' relative-path fallback.
const CONFIG: FacetConfig = {
  style: "default",
  theme: { base: "zinc", mode: "dark" },
  aliases: {
    ui: { dir: "src/shared/ui" },
    lib: { dir: "src/shared/lib" },
    hooks: { dir: "src/shared/hooks" },
  },
  velaConfig: "vela.config.ts",
};

async function main(): Promise<void> {
  await rm(path.join(PLAYGROUND, "src", "shared"), { recursive: true, force: true });

  let count = 0;
  for (const item of registry) {
    for (const file of item.files) {
      const destination = destinationFor(CONFIG, file);
      const source = await readFile(path.join(SOURCE_DIR, file.path), "utf8");
      const rewritten = rewriteImports(source, CONFIG, destination.dir);

      const target = path.join(PLAYGROUND, destination.path);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, rewritten, "utf8");
      count += 1;
    }
  }

  console.log(`✓ synced ${count} files into apps/playground/src/shared`);
}

// Not top-level await: the workspace root is CommonJS, so tsx transforms
// these scripts to CJS where top-level await is unavailable.
main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
