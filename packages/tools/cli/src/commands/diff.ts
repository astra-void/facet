import { NotImplementedError } from "../core/errors.js";

export type DiffOptions = {
  cwd?: string;
  registry?: string;
};

/**
 * `facet diff [name]` — compares copied components against the registry today.
 *
 * The copy-in model means Facet can never push an update; the most it can do is
 * show what a merge would involve. With no argument it walks everything the
 * registry knows about that also exists in the project.
 *
 * Facet records nothing at copy time (see docs/decisions/registry-hosting.md),
 * so this compares against the *current* registry source and therefore cannot
 * tell "I edited this" apart from "upstream changed". Both show up as a diff.
 * Say that in the output rather than implying the difference came from upstream.
 */
export async function diff(_name: string | undefined, _options: DiffOptions = {}): Promise<void> {
  throw new NotImplementedError("facet diff");
}
