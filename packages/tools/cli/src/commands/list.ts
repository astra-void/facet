import { readConfig } from "../core/config.js";
import { logger } from "../core/logger.js";
import { findProjectRoot } from "../core/project/findRoot.js";
import { loadIndex } from "../core/registry/load.js";
import { describeSource, resolveRegistrySource } from "../core/registry/source.js";

export type ListOptions = {
  cwd?: string;
  registry?: string;
};

/**
 * The registry this project reads, or the default when there is no project.
 *
 * `list` is the one command that has to work outside a project — it is what
 * someone runs before `init` to see what exists — so a missing or unreadable
 * `facet.json` is an ordinary outcome here rather than an error. But inside a
 * project the pinned registry is the answer to "what can I add", and listing
 * the moving one would offer components a pinned `add` cannot fetch.
 */
async function configured(options: ListOptions): Promise<string | undefined> {
  if (options.registry !== undefined) {
    return options.registry;
  }

  try {
    return (await readConfig(await findProjectRoot(options.cwd))).registry;
  } catch {
    return undefined;
  }
}

export async function list(options: ListOptions = {}): Promise<void> {
  const source = resolveRegistrySource({ registry: await configured(options) });
  const index = await loadIndex(source);
  const items = [...index.items].sort((a, b) => a.name.localeCompare(b.name));

  const width = items.reduce((longest, item) => Math.max(longest, item.name.length), 0);

  logger.break();
  for (const item of items) {
    logger.info(`  ${item.name.padEnd(width)}  ${item.description ?? ""}`.trimEnd());
  }
  logger.break();
  logger.dim(`  ${items.length} components. Add one with \`facet add <name>\`.`);
  logger.dim(`  registry: ${describeSource(source)}`);
  logger.break();
}
