/**
 * The registry contract. `registry/registry.ts` is authored against these types,
 * `scripts/build-registry.ts` emits them as JSON, and `facet add` consumes that
 * JSON. Any change here is a change to the published registry format.
 */

export const REGISTRY_ITEM_TYPES = ["registry:ui", "registry:lib", "registry:hook", "registry:block"] as const;

export type RegistryItemType = (typeof REGISTRY_ITEM_TYPES)[number];

/** Which consumer directory an item type lands in, keyed by `facet.json` alias. */
export const ITEM_TYPE_ALIAS: Record<RegistryItemType, "ui" | "lib" | "hooks"> = {
  "registry:ui": "ui",
  "registry:lib": "lib",
  "registry:hook": "hooks",
  "registry:block": "ui",
};

export type RegistryFile = {
  /** Path under `registry/src`, e.g. `ui/button.tsx`. */
  path: string;
  type: RegistryItemType;
  /** Overrides the alias-derived destination. Rare; blocks use it. */
  target?: string;
};

export type RegistryItem = {
  name: string;
  type: RegistryItemType;
  description?: string;
  files: RegistryFile[];
  /** npm packages the item needs — Lattice primitives, `@facet-ui/react-variants`, … */
  dependencies?: string[];
  devDependencies?: string[];
  /** Other registry items this one imports. Resolved transitively by `facet add`. */
  registryDependencies?: string[];
  /**
   * Semantic theme tokens the item's classes name. `facet doctor` checks these
   * resolve in the consumer's `vela.config.ts` instead of letting the failure
   * surface as a Vela diagnostic on a file the consumer never wrote.
   */
  tokens?: string[];
};

/** A file entry as published: the item metadata plus the source text itself. */
export type RegistryFilePayload = RegistryFile & {
  content: string;
};

export type RegistryItemPayload = Omit<RegistryItem, "files"> & {
  files: RegistryFilePayload[];
};

export type RegistryIndexEntry = Omit<RegistryItem, "files"> & {
  files: string[];
};

export type RegistryIndex = {
  /** Registry format version. Bumped when these types change incompatibly. */
  version: 1;
  /** Version of the `facet-rbxts` release that produced this index. */
  generatedBy: string;
  items: RegistryIndexEntry[];
};

export type Registry = RegistryItem[];

/** Authoring helper: gives `registry/registry.ts` inference and a checked shape. */
export function defineRegistry<const T extends Registry>(registry: T): T {
  return registry;
}

export function isRegistryItemType(value: string): value is RegistryItemType {
  return (REGISTRY_ITEM_TYPES as readonly string[]).includes(value);
}

export type ValidationIssue = {
  item: string;
  message: string;
};

/**
 * Structural validation of an authored registry: name uniqueness, known item
 * types, resolvable `registryDependencies`, and no file claimed by two items.
 * Runs in `pnpm registry:check` so a broken registry fails CI, not `facet add`.
 */
export function validateRegistry(registry: Registry): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const names = new Set<string>();
  const claimedFiles = new Map<string, string>();

  for (const item of registry) {
    if (names.has(item.name)) {
      issues.push({ item: item.name, message: "duplicate item name" });
    }
    names.add(item.name);

    if (!isRegistryItemType(item.type)) {
      issues.push({ item: item.name, message: `unknown item type "${item.type}"` });
    }

    if (item.files.length === 0) {
      issues.push({ item: item.name, message: "item declares no files" });
    }

    for (const file of item.files) {
      const owner = claimedFiles.get(file.path);
      if (owner !== undefined) {
        issues.push({ item: item.name, message: `file "${file.path}" is already owned by "${owner}"` });
      } else {
        claimedFiles.set(file.path, item.name);
      }
    }
  }

  for (const item of registry) {
    for (const dependency of item.registryDependencies ?? []) {
      if (!names.has(dependency)) {
        issues.push({ item: item.name, message: `registry dependency "${dependency}" does not exist` });
      }
    }
  }

  return issues;
}
