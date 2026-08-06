import path from "node:path";
import type { FacetConfig } from "../config.js";
import { ITEM_TYPE_ALIAS, type RegistryFile, type RegistryItemType } from "./schema.js";

export type Destination = {
  /** Project-relative path the file is written to. */
  path: string;
  /** Project-relative directory holding it — what `rewriteImports` resolves against. */
  dir: string;
};

/**
 * Maps a registry file onto a path in the consumer's project.
 *
 * A registry path's first segment names the alias it belongs to (`ui/button.tsx`),
 * and the rest is kept so a multi-file block stays a directory rather than
 * collapsing into the alias root.
 */
export function destinationFor(config: FacetConfig, file: RegistryFile): Destination {
  if (file.target !== undefined) {
    return { path: file.target, dir: path.posix.dirname(file.target) };
  }

  const segments = file.path.split("/");
  const tail = segments.length > 1 ? segments.slice(1).join("/") : file.path;
  const base = config.aliases[ITEM_TYPE_ALIAS[file.type]].dir;
  const target = path.posix.join(base.split(path.sep).join("/"), tail);

  return { path: target, dir: path.posix.dirname(target) };
}

/** The item type each registry path prefix implies. */
const TYPE_BY_SEGMENT: Record<string, RegistryItemType> = {
  ui: "registry:ui",
  lib: "registry:lib",
  hooks: "registry:hook",
};

/**
 * Where a file lands when all that is known about it is its path in the
 * registry index.
 *
 * The published index carries an item's files as bare strings, so neither the
 * per-file `type` nor a `target` override survives into it. The first segment
 * is the type — that is what it is for — and the item's own type covers a path
 * that does not start with a known one.
 *
 * A file that overrides its destination with `target` therefore cannot be
 * located from the index at all. Only `facet doctor` reads files this way, and
 * it reports what it could not find rather than pretending it looked.
 */
export function destinationForIndexFile(
  config: FacetConfig,
  filePath: string,
  itemType: RegistryItemType,
): Destination {
  const segment = filePath.split("/")[0] ?? "";
  return destinationFor(config, { path: filePath, type: TYPE_BY_SEGMENT[segment] ?? itemType });
}
