import { NotImplementedError } from "../core/errors.js";

export type DiffOptions = {
  cwd?: string;
};

/**
 * `facet diff [name]` — shows what changed upstream since a component was copied.
 *
 * The copy-in model means Facet can never push an update; the most it can do is
 * show the consumer what they would be merging. With no argument it lists every
 * copied component whose registry source has since changed.
 *
 * Requires knowing what the file looked like at copy time. That provenance is
 * not tracked yet — decide between a lockfile (`facet.lock`) and a content hash
 * recorded per file before implementing this.
 */
export async function diff(_name: string | undefined, _options: DiffOptions = {}): Promise<void> {
  throw new NotImplementedError("facet diff");
}
