import { readFile } from "node:fs/promises";
import path from "node:path";
import { type FacetConfig, readConfig } from "../core/config.js";
import { FileTransaction } from "../core/fs/transaction.js";
import { logger } from "../core/logger.js";
import { findProjectRoot } from "../core/project/findRoot.js";
import { destinationFor, destinationForIndexFile } from "../core/registry/destination.js";
import { loadIndex, loadItem } from "../core/registry/load.js";
import { selectItems } from "../core/registry/resolve.js";
import type { RegistryIndex, RegistryIndexEntry } from "../core/registry/schema.js";
import { type RegistrySource, resolveRegistrySource } from "../core/registry/source.js";
import { rewriteImports } from "../core/transform/rewriteImports.js";

export type RemoveOptions = {
  cwd?: string;
  /** Delete even when the file differs from the registry. */
  force?: boolean;
  registry?: string;
};

/** A copied file, and how it compares to the registry source it came from. */
type FileState = {
  path: string;
  /** Absent from the project — already gone, or never added. */
  missing: boolean;
  /** Present, and not what the registry would write there today. */
  modified: boolean;
};

type ItemPlan = {
  name: string;
  files: FileState[];
  /** Installed components outside the removal set that import this one. */
  dependents: string[];
  verdict: "remove" | "not-installed" | "modified" | "depended-on";
};

async function readIfPresent(file: string): Promise<string | undefined> {
  try {
    return await readFile(file, "utf8");
  } catch {
    return undefined;
  }
}

/**
 * Which items the project has files from. Same rule `doctor` uses: one file is
 * enough, because the question is whether anything still imports the thing
 * being removed, not whether the copy is whole.
 */
function installedNames(root: string, config: FacetConfig, index: RegistryIndex, present: Set<string>): Set<string> {
  const installed = new Set<string>();

  for (const entry of index.items) {
    for (const file of entry.files) {
      if (present.has(path.resolve(root, destinationForIndexFile(config, file, entry.type).path))) {
        installed.add(entry.name);
        break;
      }
    }
  }

  return installed;
}

/**
 * Works out what would be deleted, and what stands in the way.
 *
 * The dependent check runs to a fixed point on purpose. Removing `utils` and
 * `button` together is fine — but if `button` turns out to be modified and so
 * stays, `utils` is suddenly still imported, and one pass would already have
 * cleared it.
 */
async function plan(
  root: string,
  config: FacetConfig,
  index: RegistryIndex,
  requested: RegistryIndexEntry[],
  source: RegistrySource,
  force: boolean,
): Promise<ItemPlan[]> {
  const plans: ItemPlan[] = [];
  const present = new Set<string>();

  for (const entry of requested) {
    const payload = await loadItem(source, entry.name);
    const files: FileState[] = [];

    for (const file of payload.files) {
      const destination = destinationFor(config, file);
      const absolute = path.resolve(root, destination.path);
      const current = await readIfPresent(absolute);
      if (current !== undefined) {
        present.add(absolute);
      }

      files.push({
        path: destination.path,
        missing: current === undefined,
        // Compared after the same rewrite `add` applied on the way in, so a
        // file that was only ever copied reads as untouched.
        modified: current !== undefined && current !== rewriteImports(file.content, config, destination.dir),
      });
    }

    plans.push({
      name: entry.name,
      files,
      dependents: [],
      verdict: files.every((file) => file.missing)
        ? "not-installed"
        : files.some((file) => file.modified) && !force
          ? "modified"
          : "remove",
    });
  }

  // Every file of every item, so the installed set sees the whole project
  // rather than only what was named.
  for (const entry of index.items) {
    for (const file of entry.files) {
      const absolute = path.resolve(root, destinationForIndexFile(config, file, entry.type).path);
      if (!present.has(absolute) && (await readIfPresent(absolute)) !== undefined) {
        present.add(absolute);
      }
    }
  }

  const installed = installedNames(root, config, index, present);

  for (;;) {
    const going = new Set(plans.filter((item) => item.verdict === "remove").map((item) => item.name));
    let changed = false;

    for (const item of plans) {
      if (item.verdict !== "remove") {
        continue;
      }

      const dependents = index.items
        .filter(
          (entry) =>
            installed.has(entry.name) &&
            !going.has(entry.name) &&
            (entry.registryDependencies ?? []).includes(item.name),
        )
        .map((entry) => entry.name);

      if (dependents.length > 0) {
        item.dependents = dependents;
        item.verdict = "depended-on";
        changed = true;
      }
    }

    if (!changed) {
      return plans;
    }
  }
}

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
 *
 * `--force` does not override the dependent check. That one is not about whose
 * file it is: deleting `utils` out from under an installed `button` leaves a
 * project that does not compile, and the user asked to remove one component,
 * not to break another.
 */
export async function remove(names: string[], options: RemoveOptions = {}): Promise<void> {
  const root = await findProjectRoot(options.cwd);
  const config = await readConfig(root);

  const source = resolveRegistrySource({ registry: options.registry ?? config.registry });
  const index = await loadIndex(source);
  const requested = selectItems(index, names);

  const plans = await plan(root, config, index, requested, source, options.force === true);
  const going = plans.filter((item) => item.verdict === "remove");

  logger.break();
  for (const item of going) {
    for (const file of item.files.filter((candidate) => !candidate.missing)) {
      logger.step(`remove  ${file.path}`);
    }
  }

  for (const item of plans) {
    if (item.verdict === "not-installed") {
      logger.dim(`  ${item.name} is not installed`);
    } else if (item.verdict === "modified") {
      const modified = item.files.filter((file) => file.modified).map((file) => file.path);
      logger.warn(`${item.name} differs from the registry: ${modified.join(", ")}`);
      logger.dim("  Upstream may have moved instead — either way, `--force` deletes it.");
    } else if (item.verdict === "depended-on") {
      logger.warn(`${item.name} is still imported by ${item.dependents.join(", ")}`);
      logger.dim("  Remove those first. `--force` does not cover this one.");
    }
  }

  if (going.length === 0) {
    logger.break();
    logger.info("Nothing removed.");
    return;
  }

  const transaction = new FileTransaction(root);
  for (const item of going) {
    for (const file of item.files.filter((candidate) => !candidate.missing)) {
      transaction.delete(file.path);
    }
  }
  await transaction.commit();

  logger.break();
  logger.success(`Removed ${going.length} component${going.length === 1 ? "" : "s"}.`);
  logger.dim("  Directories are left alone, and so is anything you added next to them.");
  logger.break();
}
