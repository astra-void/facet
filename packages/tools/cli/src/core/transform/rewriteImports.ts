import path from "node:path";
import type { AliasConfig, FacetConfig } from "../config.js";

/** Prefix registry sources use to address each other. */
export const REGISTRY_PREFIX = "~/";

const ALIAS_DIRS = ["ui", "lib", "hooks"] as const;
type AliasKey = (typeof ALIAS_DIRS)[number];

const IMPORT_PATTERN = /(["'])~\/([^"']+)\1/g;

function aliasFor(config: FacetConfig, segment: string): { key: AliasKey; alias: AliasConfig } | undefined {
  for (const key of ALIAS_DIRS) {
    if (segment === key) {
      return { key, alias: config.aliases[key] };
    }
  }
  return undefined;
}

function toPosix(value: string): string {
  return value.split(path.sep).join("/");
}

/**
 * Rewrites `~/ui/button` style imports to whatever the consumer's project uses.
 *
 * With an `import` specifier configured the rewrite is textual. Without one it
 * falls back to a relative path computed from the importing file's destination,
 * because a project with no tsconfig `paths` has no other way to resolve it.
 */
export function rewriteImports(source: string, config: FacetConfig, destinationDir: string): string {
  return source.replace(IMPORT_PATTERN, (match, quote: string, specifier: string) => {
    const [head, ...rest] = specifier.split("/");
    if (head === undefined) {
      return match;
    }

    const resolved = aliasFor(config, head);
    if (resolved === undefined) {
      // Unknown alias segment: leave it alone so it fails loudly at typecheck
      // rather than being silently rewritten to something wrong.
      return match;
    }

    const { alias } = resolved;
    const tail = rest.join("/");

    if (alias.import !== undefined) {
      const specifierOut = tail === "" ? alias.import : `${alias.import}/${tail}`;
      return `${quote}${specifierOut}${quote}`;
    }

    const targetPath = tail === "" ? alias.dir : path.join(alias.dir, tail);
    let relative = toPosix(path.relative(destinationDir, targetPath));
    if (!relative.startsWith(".")) {
      relative = `./${relative}`;
    }
    return `${quote}${relative}${quote}`;
  });
}

/** Destination directory for a file, given its owning alias. */
export function destinationDir(config: FacetConfig, key: AliasKey): string {
  return config.aliases[key].dir;
}
