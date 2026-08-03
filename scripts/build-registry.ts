import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  RegistryIndex,
  RegistryIndexEntry,
  RegistryItemPayload,
} from "../packages/tools/cli/src/core/registry/schema";
import { validateRegistry } from "../packages/tools/cli/src/core/registry/schema";
import registry from "../registry/registry";

/**
 * Builds the static registry the CLI fetches at runtime. The output is a
 * GitHub Pages artifact: `site/r/index.json` plus one JSON per component, and a
 * landing page listing what is there.
 *
 * Nothing here is committed — the Pages workflow rebuilds it, so the published
 * site can never drift from `registry/`.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = path.join(ROOT, "registry", "src");
const SITE_DIR = path.join(ROOT, "site");
const OUT_DIR = path.join(SITE_DIR, "r");

const checkOnly = process.argv.includes("--check");

/**
 * Must match `DEFAULT_REGISTRY_URL`'s host in the CLI. Deploying from an Actions
 * artifact replaces the whole site, so the CNAME has to be part of it — without
 * it GitHub can drop the custom domain back to the github.io default, and every
 * released CLI would be pointing at a host that no longer answers.
 */
const CUSTOM_DOMAIN = "facet.astra-void.xyz";

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };

async function cliVersion(): Promise<string> {
  const raw = await readFile(path.join(ROOT, "packages", "tools", "cli", "package.json"), "utf8");
  return (JSON.parse(raw) as { version: string }).version;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => HTML_ESCAPES[char] ?? char);
}

function landingPage(index: RegistryIndex): string {
  const rows = index.items
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(
      (item) =>
        `      <tr><td><a href="r/${escapeHtml(item.name)}.json"><code>${escapeHtml(item.name)}</code></a></td>` +
        `<td>${escapeHtml(item.description ?? "")}</td></tr>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Facet registry</title>
<style>
  :root { color-scheme: light dark; --fg: #18181b; --dim: #71717a; --bg: #fff; --line: #e4e4e7; }
  @media (prefers-color-scheme: dark) {
    :root { --fg: #fafafa; --dim: #a1a1aa; --bg: #09090b; --line: #27272a; }
  }
  body { margin: 0 auto; padding: 4rem 1.5rem; max-width: 46rem; background: var(--bg); color: var(--fg);
         font: 16px/1.6 ui-sans-serif, system-ui, sans-serif; }
  h1 { font-size: 1.5rem; margin: 0 0 .5rem; }
  p { color: var(--dim); }
  pre { background: color-mix(in srgb, var(--fg) 5%, transparent); padding: .75rem 1rem; border-radius: .5rem;
        overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; margin-top: 2rem; }
  td { border-top: 1px solid var(--line); padding: .6rem .5rem; vertical-align: top; }
  td:first-child { white-space: nowrap; }
  td:last-child { color: var(--dim); }
  a { color: inherit; }
</style>
</head>
<body>
  <h1>Facet registry</h1>
  <p>Copy-in UI components for roblox-ts, built on Lattice UI and Vela.
     This host serves the JSON the CLI reads; it is not documentation.</p>
  <pre><code>npx facet-rbxts init
npx facet-rbxts add button</code></pre>
  <p>Index: <a href="r/index.json"><code>r/index.json</code></a> &middot;
     format version ${index.version} &middot; built from facet-rbxts ${escapeHtml(index.generatedBy)}</p>
  <table>
${rows}
  </table>
</body>
</html>
`;
}

async function main(): Promise<void> {
  const issues = validateRegistry(registry);
  if (issues.length > 0) {
    for (const issue of issues) {
      console.error(`✗ ${issue.item}: ${issue.message}`);
    }
    process.exitCode = 1;
    return;
  }

  // Every declared file must exist and be readable before anything is written,
  // so a typo in registry.ts fails the build rather than publishing a broken item.
  const payloads: RegistryItemPayload[] = [];
  for (const item of registry) {
    const files = [];
    for (const file of item.files) {
      const absolute = path.join(SOURCE_DIR, file.path);
      let content: string;
      try {
        content = await readFile(absolute, "utf8");
      } catch {
        console.error(`✗ ${item.name}: declared file "${file.path}" does not exist at ${absolute}`);
        process.exitCode = 1;
        return;
      }
      files.push({ ...file, content });
    }
    payloads.push({ ...item, files });
  }

  if (checkOnly) {
    console.log(`✓ registry is valid (${registry.length} items)`);
    return;
  }

  const index: RegistryIndex = {
    version: 1,
    generatedBy: await cliVersion(),
    items: registry.map(
      (item): RegistryIndexEntry => ({
        ...item,
        files: item.files.map((file) => file.path),
      }),
    ),
  };

  await rm(SITE_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  // Without .nojekyll, Pages runs the output through Jekyll, which drops files
  // and directories whose names begin with an underscore.
  await writeFile(path.join(SITE_DIR, ".nojekyll"), "", "utf8");
  await writeFile(path.join(SITE_DIR, "CNAME"), `${CUSTOM_DOMAIN}\n`, "utf8");
  await writeFile(path.join(SITE_DIR, "index.html"), landingPage(index), "utf8");
  await writeFile(path.join(OUT_DIR, "index.json"), `${JSON.stringify(index, undefined, 2)}\n`, "utf8");
  for (const payload of payloads) {
    await writeFile(path.join(OUT_DIR, `${payload.name}.json`), `${JSON.stringify(payload, undefined, 2)}\n`, "utf8");
  }

  console.log(`✓ built ${payloads.length} components into ${path.relative(ROOT, SITE_DIR)}`);
}

// Not top-level await: the workspace root is CommonJS, so tsx transforms
// these scripts to CJS where top-level await is unavailable.
main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
