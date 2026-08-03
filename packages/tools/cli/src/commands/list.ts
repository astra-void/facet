import { logger } from "../core/logger.js";
import { loadIndex } from "../core/registry/load.js";
import { describeSource, resolveRegistrySource } from "../core/registry/source.js";

export type ListOptions = {
  registry?: string;
};

export async function list(options: ListOptions = {}): Promise<void> {
  const source = resolveRegistrySource(options);
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
