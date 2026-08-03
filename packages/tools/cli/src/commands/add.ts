import { NotImplementedError } from "../core/errors.js";

export type AddOptions = {
  cwd?: string;
  /** Registry URL or local path, overriding facet.json and the default. */
  registry?: string;
  /** Overwrite files that already exist instead of skipping them. */
  overwrite?: boolean;
  /** Resolve and report, write nothing. */
  dryRun?: boolean;
  /** Skip the npm install step. */
  noDeps?: boolean;
};

/**
 * `facet add <names...>` — copies components into the project.
 *
 * Steps, in order:
 *  1. read `facet.json` (error → tell them to run `facet init`)
 *  2. `resolveItems` the requested names into the full transitive set
 *  3. load each item payload, rewrite `~/` imports for the destination
 *  4. report collisions; skip existing files unless `--overwrite`
 *  5. write every file through one transaction, so a mid-run failure leaves
 *     nothing half-copied
 *  6. install the union of npm dependencies
 *  7. warn about any `tokens` the project's Vela theme does not define
 *
 * Step 5 is the reason this is not a loop of `writeFile`: `add dialog` touches
 * several files, and a partial copy is worse than no copy.
 */
export async function add(_names: string[], _options: AddOptions = {}): Promise<void> {
  throw new NotImplementedError("facet add");
}
