import { readFile } from "node:fs/promises";
import path from "node:path";
import { type FacetConfig, readConfig } from "../core/config.js";
import { color, logger } from "../core/logger.js";
import { findProjectRoot } from "../core/project/findRoot.js";
import { destinationFor } from "../core/registry/destination.js";
import { loadIndex, loadItem } from "../core/registry/load.js";
import { selectItems } from "../core/registry/resolve.js";
import type { RegistryIndexEntry } from "../core/registry/schema.js";
import { describeSource, type RegistrySource, resolveRegistrySource } from "../core/registry/source.js";
import { rewriteImports } from "../core/transform/rewriteImports.js";
import { unifiedDiff } from "../core/unifiedDiff.js";

export type DiffOptions = {
  cwd?: string;
  registry?: string;
};

type FileComparison = {
  path: string;
  /** Unified-diff body, empty when the file matches the registry. */
  hunks: string[];
  /** In the registry, not in the project. */
  gone: boolean;
};

async function readIfPresent(file: string): Promise<string | undefined> {
  try {
    return await readFile(file, "utf8");
  } catch {
    return undefined;
  }
}

/**
 * Compares one item's files against what the registry would write today.
 *
 * Returns nothing for an item with no files in the project at all: `diff` with
 * no argument walks the whole registry, and a component that was never added
 * is not news.
 */
async function compare(
  root: string,
  config: FacetConfig,
  source: RegistrySource,
  entry: RegistryIndexEntry,
): Promise<FileComparison[] | undefined> {
  const payload = await loadItem(source, entry.name);
  const comparisons: FileComparison[] = [];
  let installed = false;

  for (const file of payload.files) {
    const destination = destinationFor(config, file);
    const current = await readIfPresent(path.resolve(root, destination.path));

    if (current === undefined) {
      comparisons.push({ path: destination.path, hunks: [], gone: true });
      continue;
    }

    installed = true;
    comparisons.push({
      path: destination.path,
      // Against the same rewrite `add` applied on the way in, so the alias and
      // directory choices of this project are not reported as changes.
      hunks: unifiedDiff(rewriteImports(file.content, config, destination.dir), current),
      gone: false,
    });
  }

  return installed ? comparisons : undefined;
}

/**
 * `facet diff [name]` — compares copied components against the registry today.
 *
 * The copy-in model means Facet can never push an update; the most it can do is
 * show what a merge would involve. With no argument it walks everything the
 * registry knows about that also exists in the project.
 *
 * Facet records nothing at copy time (see docs/decisions/provenance.md), so this
 * compares against the *current* registry source and therefore cannot tell "I
 * edited this" apart from "upstream changed". Both show up as a diff. Say that in
 * the output rather than implying the difference came from upstream.
 *
 * The direction is registry → project: `-` is what the registry has, `+` is what
 * the file says. That way applying the `+` side is what "keep mine" means, and a
 * diff of your own edits reads the way `git diff` would have shown you making
 * them.
 */
export async function diff(name: string | undefined, options: DiffOptions = {}): Promise<void> {
  const root = await findProjectRoot(options.cwd);
  const config = await readConfig(root);

  const source = resolveRegistrySource({ registry: options.registry ?? config.registry });
  const index = await loadIndex(source);
  const entries = name === undefined ? index.items : selectItems(index, [name]);

  const compared: { entry: RegistryIndexEntry; files: FileComparison[] }[] = [];
  for (const entry of entries) {
    const files = await compare(root, config, source, entry);
    if (files !== undefined) {
      compared.push({ entry, files });
    }
  }

  logger.break();

  if (compared.length === 0) {
    logger.info(
      name === undefined ? "  No components from this registry are installed." : `  ${name} is not installed.`,
    );
    logger.break();
    return;
  }

  let changed = 0;

  for (const { entry, files } of compared) {
    for (const file of files) {
      if (file.gone) {
        logger.dim(`  ${file.path} — in the registry, not in this project (${entry.name})`);
        continue;
      }
      if (file.hunks.length === 0) {
        continue;
      }

      changed += 1;
      logger.break();
      logger.info(`  ${file.path}  ${color.meta(`(${entry.name})`)}`);
      for (const line of file.hunks) {
        if (line.startsWith("@@")) {
          logger.info(`  ${color.meta(line)}`);
        } else if (line.startsWith("+")) {
          logger.info(`  ${color.added(line)}`);
        } else if (line.startsWith("-")) {
          logger.info(`  ${color.removed(line)}`);
        } else {
          logger.info(`  ${line}`);
        }
      }
    }
  }

  logger.break();
  if (changed === 0) {
    logger.success(`${compared.length} installed component(s) match the registry.`);
    logger.break();
    return;
  }

  logger.info(`  ${changed} file(s) differ from ${describeSource(source)}.`);
  // The contract of this command is that it does not know which side moved.
  logger.dim("  `-` is the registry as it stands today, `+` is your file.");
  logger.dim("  Nothing is recorded at copy time, so a difference here is your edit, a change");
  logger.dim("  upstream, or both. Facet cannot tell them apart, and neither can this output.");
  logger.break();
}
