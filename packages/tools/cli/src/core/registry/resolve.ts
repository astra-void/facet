import { FacetError } from "../errors.js";
import type { RegistryIndex, RegistryIndexEntry, RegistryProvider } from "./schema.js";

export class RegistryResolutionError extends FacetError {}

/** One wording for a name the registry does not have, wherever it is looked up. */
function unknownItem(name: string, requiredBy: string | undefined): RegistryResolutionError {
  const suffix = requiredBy === undefined ? "" : ` (required by "${requiredBy}")`;
  return new RegistryResolutionError(`Unknown component "${name}"${suffix}. Run \`facet list\` to see what exists.`);
}

/**
 * The named items and nothing else, deduplicated, in the order asked for.
 *
 * `facet remove` wants exactly what was named — pulling in dependencies here
 * would delete `utils` because someone removed `button`.
 */
export function selectItems(index: RegistryIndex, names: string[]): RegistryIndexEntry[] {
  const byName = new Map(index.items.map((item) => [item.name, item] as const));

  const selected: RegistryIndexEntry[] = [];
  const seen = new Set<string>();

  for (const name of names) {
    const item = byName.get(name);
    if (item === undefined) {
      throw unknownItem(name, undefined);
    }
    if (!seen.has(name)) {
      seen.add(name);
      selected.push(item);
    }
  }

  return selected;
}

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
      throw unknownItem(name, trail[trail.length - 1]);
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

/**
 * Union of the providers an install set needs, deduplicated by package and
 * name — `dialog` and `popover` both want the one `PortalProvider`, and the
 * consumer's app is wrapped in it once.
 */
export function collectProviders(items: RegistryIndexEntry[]): RegistryProvider[] {
  const providers = new Map<string, RegistryProvider>();

  for (const item of items) {
    for (const provider of item.providers ?? []) {
      const key = `${provider.package}#${provider.name}`;
      if (!providers.has(key)) {
        providers.set(key, provider);
      }
    }
  }

  return [...providers.values()];
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
