import { readFile } from "node:fs/promises";
import path from "node:path";
import type { FacetConfig } from "../config.js";

export type WiringState =
  | { kind: "missing"; content: string }
  | { kind: "wired" }
  | { kind: "unwired"; snippet: string };

export function velaConfigTemplate(config: FacetConfig): string {
  return `import { facetTheme } from "@facet-ui/theme";
import { defineConfig } from "vela-rbxts";

export default defineConfig({
  theme: {
    extend: {
      ...facetTheme({ base: "${config.theme.base}", mode: "${config.theme.mode}" }),
    },
  },
});
`;
}

function snippetFor(config: FacetConfig): string {
  return `import { facetTheme } from "@facet-ui/theme";

// inside defineConfig({ theme: { extend: { ... } } }):
...facetTheme({ base: "${config.theme.base}", mode: "${config.theme.mode}" }),`;
}

/**
 * Reports whether the project's Vela config supplies Facet's tokens.
 *
 * Deliberately does not rewrite an existing config. Vela configs are ordinary
 * TypeScript — comments, spreads, computed values, plugins — and there is no
 * edit this could make by pattern-matching that is worth the chance of mangling
 * a file the consumer wrote. Creating one that does not exist is safe; changing
 * one that does is the consumer's call, so `init` prints the exact lines.
 */
export async function inspectVelaConfig(root: string, config: FacetConfig): Promise<WiringState> {
  const file = path.resolve(root, config.velaConfig);

  let source: string;
  try {
    source = await readFile(file, "utf8");
  } catch {
    return { kind: "missing", content: velaConfigTemplate(config) };
  }

  return source.includes("@facet-ui/theme") ? { kind: "wired" } : { kind: "unwired", snippet: snippetFor(config) };
}
