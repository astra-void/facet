import { access } from "node:fs/promises";
import path from "node:path";
import { type FacetConfig, readConfig } from "../core/config.js";
import { FileTransaction } from "../core/fs/transaction.js";
import { logger } from "../core/logger.js";
import { ensurePackages } from "../core/pm.js";
import { findProjectRoot } from "../core/project/findRoot.js";
import { inspectVelaConfig } from "../core/project/velaConfig.js";
import { destinationFor } from "../core/registry/destination.js";
import { loadIndex, loadItem } from "../core/registry/load.js";
import { collectDependencies, resolveItems } from "../core/registry/resolve.js";
import { describeSource, resolveRegistrySource } from "../core/registry/source.js";
import { rewriteImports } from "../core/transform/rewriteImports.js";

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

type PlannedFile = {
  item: string;
  path: string;
  content: string;
  exists: boolean;
};

async function exists(candidate: string): Promise<boolean> {
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
  }
}

/**
 * Turns the requested names into the exact set of files to write, with `~/`
 * imports already rewritten for where each file lands.
 */
export async function planAdd(
  root: string,
  config: FacetConfig,
  names: string[],
  options: AddOptions,
): Promise<{ files: PlannedFile[]; dependencies: string[]; tokens: string[]; source: string }> {
  const source = resolveRegistrySource({ registry: options.registry ?? config.registry });
  const index = await loadIndex(source);
  const entries = resolveItems(index, names);

  const files: PlannedFile[] = [];
  for (const entry of entries) {
    const payload = await loadItem(source, entry.name);
    for (const file of payload.files) {
      const destination = destinationFor(config, file);
      files.push({
        item: entry.name,
        path: destination.path,
        content: rewriteImports(file.content, config, destination.dir),
        exists: await exists(path.resolve(root, destination.path)),
      });
    }
  }

  const { dependencies, tokens } = collectDependencies(entries);
  return { files, dependencies, tokens, source: describeSource(source) };
}

export async function add(names: string[], options: AddOptions = {}): Promise<void> {
  const root = await findProjectRoot(options.cwd);
  const config = await readConfig(root);

  const { files, dependencies, tokens, source } = await planAdd(root, config, names, options);

  const writing = options.overwrite === true ? files : files.filter((file) => !file.exists);
  const skipped = options.overwrite === true ? [] : files.filter((file) => file.exists);

  logger.break();
  for (const file of writing) {
    logger.step(`${file.exists ? "overwrite" : "write"}  ${file.path}`);
  }
  for (const file of skipped) {
    logger.dim(`  exists     ${file.path}`);
  }

  if (options.dryRun === true) {
    logger.break();
    logger.dim(`  registry: ${source}`);
    logger.dim(`  dependencies: ${dependencies.join(", ") || "none"}`);
    logger.break();
    logger.info("Nothing written (--dry-run).");
    return;
  }

  if (writing.length === 0) {
    logger.break();
    logger.info("Everything requested is already here. Pass --overwrite to replace it.");
    return;
  }

  const transaction = new FileTransaction(root);
  for (const file of writing) {
    transaction.add(file.path, file.content);
  }
  await transaction.commit();

  logger.break();
  logger.success(`Wrote ${writing.length} file${writing.length === 1 ? "" : "s"}.`);

  if (options.noDeps !== true) {
    await ensurePackages(root, dependencies);
  }

  // Without Facet's tokens in the Vela theme, the copied classes compile to
  // Vela diagnostics on a file the consumer never wrote. Say so here rather
  // than letting the next build be the messenger.
  const vela = await inspectVelaConfig(root, config);
  if (vela.kind !== "wired" && tokens.length > 0) {
    logger.break();
    logger.warn(`${config.velaConfig} does not use facetTheme. These components need these tokens:`);
    logger.dim(`  ${tokens.join(", ")}`);
    logger.dim("  Run `facet doctor` for the fix.");
  }

  if (skipped.length > 0) {
    logger.break();
    logger.dim(`  ${skipped.length} file(s) left alone because they already exist. --overwrite replaces them.`);
  }
}
