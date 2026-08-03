import { NotImplementedError } from "../core/errors.js";

export type RemoveOptions = {
  cwd?: string;
  /** Delete files even if they differ from what was copied. */
  force?: boolean;
};

/**
 * `facet remove <names...>` — deletes copied component files.
 *
 * Copied files belong to the consumer and may have been edited, so this refuses
 * to delete anything that differs from the registry source unless `--force`,
 * and never removes a file another installed component still imports.
 */
export async function remove(_names: string[], _options: RemoveOptions = {}): Promise<void> {
  throw new NotImplementedError("facet remove");
}
