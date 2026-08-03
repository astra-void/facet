import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FacetBase, FacetMode } from "@facet-ui/theme";

export const CONFIG_FILENAME = "facet.json";

/**
 * Where a class of files lands, and how other copied files import it.
 *
 * `dir` is a real path from the project root because roblox-ts projects are laid
 * out by Rojo, not by module resolution. `import` is the specifier other copied
 * components use to reach it; leave it unset and the CLI writes relative imports
 * instead, which is the only thing that works in a project without tsconfig
 * `paths`.
 */
export type AliasConfig = {
  dir: string;
  import?: string;
};

export type FacetConfig = {
  $schema?: string;
  /** Registry style variant. Only `default` exists today. */
  style: "default";
  theme: {
    base: FacetBase;
    mode: FacetMode;
  };
  aliases: {
    ui: AliasConfig;
    lib: AliasConfig;
    hooks: AliasConfig;
  };
  /** Path to the project's Vela config, patched by `facet init`. */
  velaConfig: string;
  /**
   * Registry to read components from. Omit for the default published one;
   * set it to pin a fork, a private registry, or a specific version.
   */
  registry?: string;
};

export const DEFAULT_CONFIG: FacetConfig = {
  $schema: "https://facet.astra-void.xyz/schema.json",
  style: "default",
  theme: {
    base: "zinc",
    mode: "dark",
  },
  aliases: {
    ui: { dir: "src/shared/ui", import: "shared/ui" },
    lib: { dir: "src/shared/lib", import: "shared/lib" },
    hooks: { dir: "src/shared/hooks", import: "shared/hooks" },
  },
  velaConfig: "vela.config.ts",
};

export class MissingConfigError extends Error {
  constructor() {
    super(`No ${CONFIG_FILENAME} found. Run \`facet init\` first.`);
  }
}

export function configPath(projectRoot: string): string {
  return path.join(projectRoot, CONFIG_FILENAME);
}

export async function readConfig(projectRoot: string): Promise<FacetConfig> {
  let raw: string;
  try {
    raw = await readFile(configPath(projectRoot), "utf8");
  } catch {
    throw new MissingConfigError();
  }

  // Parsed loosely and then normalized: a hand-edited facet.json missing a key
  // should pick up the default rather than crash mid-copy.
  const parsed = JSON.parse(raw) as Partial<FacetConfig>;
  return {
    ...DEFAULT_CONFIG,
    ...parsed,
    theme: { ...DEFAULT_CONFIG.theme, ...parsed.theme },
    aliases: { ...DEFAULT_CONFIG.aliases, ...parsed.aliases },
  };
}

export async function writeConfig(projectRoot: string, config: FacetConfig): Promise<void> {
  await writeFile(configPath(projectRoot), `${JSON.stringify(config, undefined, 2)}\n`, "utf8");
}
