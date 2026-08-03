import type { RegistryIndex, RegistryIndexEntry } from "./schema.js";

export class RegistryResolutionError extends Error {}

/**
 * Expands the requested item names into the full install set, in dependency
 * order (dependencies before dependents), deduplicated.
 *
 * Cycles are an authoring bug, not a user-facing condition, so they throw
 * rather than being silently broken.
 */
export function resolveItems(index: RegistryIndex, requested: string[]): RegistryIndexEntry[] {
  const byName = new Map(index.items.map((item) => [item.name, item] as const));

  const resolved: RegistryIndexEntry[] = [];
  const settled = new Set<string>();
  const visiting = new Set<string>();

  const visit = (name: string, trail: string[]) => {
    if (settled.has(name)) {
      return;
    }

    if (visiting.has(name)) {
      throw new RegistryResolutionError(`Circular registry dependency: ${[...trail, name].join(" -> ")}`);
    }

    const item = byName.get(name);
    if (item === undefined) {
      const suffix = trail.length > 0 ? ` (required by "${trail[trail.length - 1]}")` : "";
      throw new RegistryResolutionError(`Unknown component "${name}"${suffix}. Run \`facet list\` to see what exists.`);
    }

    visiting.add(name);
    for (const dependency of item.registryDependencies ?? []) {
      visit(dependency, [...trail, name]);
    }
    visiting.delete(name);

    settled.add(name);
    resolved.push(item);
  };

  for (const name of requested) {
    visit(name, []);
  }

  return resolved;
}

/** Union of npm dependencies across an install set, deduplicated. */
export function collectDependencies(items: RegistryIndexEntry[]): {
  dependencies: string[];
  devDependencies: string[];
  tokens: string[];
} {
  const dependencies = new Set<string>();
  const devDependencies = new Set<string>();
  const tokens = new Set<string>();

  for (const item of items) {
    for (const dependency of item.dependencies ?? []) {
      dependencies.add(dependency);
    }
    for (const dependency of item.devDependencies ?? []) {
      devDependencies.add(dependency);
    }
    for (const token of item.tokens ?? []) {
      tokens.add(token);
    }
  }

  return {
    dependencies: [...dependencies].sort(),
    devDependencies: [...devDependencies].sort(),
    tokens: [...tokens].sort(),
  };
}
