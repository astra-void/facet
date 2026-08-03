import path from "node:path";

/**
 * Where the registry is published. Change this in one place; it is baked into
 * every released CLI as the default, so a wrong value is a dead `facet add`.
 */
export const DEFAULT_REGISTRY_URL = "https://facet.astra-void.xyz/r";

export type RegistrySource = { kind: "dir"; dir: string } | { kind: "url"; baseUrl: string };

export type SourceOverrides = {
  /** `--registry`, or the `registry` field in facet.json. A URL or a local path. */
  registry?: string;
};

function isUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

/**
 * Resolution order, most specific first:
 *
 *  1. `FACET_REGISTRY_DIR` — a local build. This is how the repo tests the CLI
 *     against the working tree without publishing.
 *  2. `--registry` / `facet.json`'s `registry` — a URL or path, for forks and
 *     private registries.
 *  3. `FACET_REGISTRY_URL`
 *  4. `DEFAULT_REGISTRY_URL`
 *
 * The registry is fetched rather than bundled with the CLI on purpose: adding a
 * component should not require a CLI release, and a bundled copy would mean
 * `facet add button` quietly produced different files depending on how old the
 * installed CLI was.
 */
export function resolveRegistrySource(overrides: SourceOverrides = {}): RegistrySource {
  const dirOverride = process.env.FACET_REGISTRY_DIR;
  if (dirOverride !== undefined) {
    return { kind: "dir", dir: path.resolve(dirOverride) };
  }

  const configured = overrides.registry ?? process.env.FACET_REGISTRY_URL;
  if (configured !== undefined && configured !== "") {
    return isUrl(configured)
      ? { kind: "url", baseUrl: configured.replace(/\/+$/, "") }
      : { kind: "dir", dir: path.resolve(configured) };
  }

  return { kind: "url", baseUrl: DEFAULT_REGISTRY_URL };
}

export function describeSource(source: RegistrySource): string {
  return source.kind === "dir" ? source.dir : source.baseUrl;
}
