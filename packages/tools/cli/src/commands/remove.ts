import { NotImplementedError } from "../core/errors.js";

export type RemoveOptions = {
  cwd?: string;
  /** Delete even when the file differs from the registry. */
  force?: boolean;
  registry?: string;
};

/**
 * `facet remove <names...>` — deletes copied component files.
 *
 * Copied files belong to the consumer and are meant to be edited, so this
 * refuses to delete anything whose contents differ from the registry source
 * unless `--force`, and never removes a file another installed component still
 * imports.
 *
 * With nothing recorded at copy time (docs/decisions/provenance.md), "differs
 * from the registry" is the closest available stand-in for "you changed this" —
 * it also fires when only upstream moved. That is the safe direction to be wrong
 * in: the worst case is asking for `--force` on a file the user did not touch.
 */
export async function remove(_names: string[], _options: RemoveOptions = {}): Promise<void> {
  throw new NotImplementedError("facet remove");
}
