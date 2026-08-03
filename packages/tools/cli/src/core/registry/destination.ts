import path from "node:path";
import type { FacetConfig } from "../config.js";
import { ITEM_TYPE_ALIAS, type RegistryFile } from "./schema.js";

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
