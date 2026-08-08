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

/**
 * Values the CLI knows how to write for a provider prop in a roblox-ts client.
 *
 * The registry says *what a prop needs*, not what to type: the expression for
 * the local player's `PlayerGui` is knowledge about roblox-ts, and it belongs
 * in the tool that reads the consumer's entry file rather than in a string the
 * registry hands over to be pasted somewhere it cannot see.
 */
export const PROVIDER_VALUES = ["player-gui"] as const;

export type ProviderValue = (typeof PROVIDER_VALUES)[number];

/**
 * A component that has to wrap the consumer's app for an item to work at all.
 *
 * `dialog` is the first of these: Lattice reads the portal target from a strict
 * context, so a dialog without a `PortalProvider` above it throws when it opens
 * rather than rendering in the wrong place. Nothing in the copied file can fix
 * that — the wiring is in a file Facet does not own — so the item declares it
 * and `facet add` offers to write it.
 */
export type RegistryProvider = {
  /** Exported component name, e.g. `PortalProvider`. */
  name: string;
  /** npm package it is imported from, e.g. `@lattice-ui/react-layer`. */
  package: string;
  /** Props the provider needs, keyed by prop name. */
  props?: Record<string, ProviderValue>;
  /** One line saying what breaks without it. Printed wherever it is reported. */
  reason: string;
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
   * Components that must wrap the consumer's app for this item to work.
   * `facet add` offers to write them into the client entry; `facet doctor`
   * checks they are still there.
   */
  providers?: RegistryProvider[];
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
  /**
   * Registry format version. Bumped when these types change incompatibly.
   *
   * "Incompatibly" is the whole test, and it cuts the other way from what it
   * looks like: `loadIndex` *rejects* an index whose version it does not know,
   * so bumping this is what breaks every CLI already installed. An optional
   * field added to `RegistryItem` breaks nothing — an older CLI ignores a key
   * it does not read, and a newer one reads `undefined` from an older registry
   * — so `providers` arrived without a bump. Removing a field, renaming one, or
   * changing what an existing one means is the case this number exists for.
   */
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
 * Splits `name@range` without eating a scoped package's leading `@`. Local to
 * this module on purpose: the CLI has the same function in `core/pkgspec.ts`,
 * but this file is the published format and is imported by `registry.ts`, so it
 * stays free of anything that would drag the rest of the CLI in with it.
 */
function specName(spec: string): string {
  const at = spec.lastIndexOf("@");
  return at > 0 ? spec.slice(0, at) : spec;
}

/**
 * Structural validation of an authored registry: name uniqueness, known item
 * types, resolvable `registryDependencies`, no file claimed by two items, and
 * one spec per npm package across the whole registry.
 * Runs in `pnpm registry:check` so a broken registry fails CI, not `facet add`.
 */
export function validateRegistry(registry: Registry): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const names = new Set<string>();
  const claimedFiles = new Map<string, string>();
  // `facet add` unions dependency strings across the install set, so
  // `@lattice-ui/react-runtime` and `@lattice-ui/react-runtime@^0.8.0` in two
  // items survive as two entries and both reach the package manager.
  const specs = new Map<string, { spec: string; item: string }>();

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

    for (const provider of item.providers ?? []) {
      if (provider.name === "" || provider.package === "" || provider.reason === "") {
        issues.push({ item: item.name, message: "provider needs a name, a package, and a reason" });
      }
      // A provider whose package nothing installs is a wrapper the consumer
      // cannot import — the CLI writes the import, the package manager was
      // never told to fetch it.
      if (!(item.dependencies ?? []).some((spec) => specName(spec) === provider.package)) {
        issues.push({
          item: item.name,
          message: `provider "${provider.name}" comes from "${provider.package}", which the item does not depend on`,
        });
      }
      for (const [prop, value] of Object.entries(provider.props ?? {})) {
        if (!(PROVIDER_VALUES as readonly string[]).includes(value)) {
          issues.push({
            item: item.name,
            message: `provider "${provider.name}" wants an unknown value "${value}" for prop "${prop}"`,
          });
        }
      }
    }

    for (const spec of [...(item.dependencies ?? []), ...(item.devDependencies ?? [])]) {
      const name = specName(spec);
      const seen = specs.get(name);
      if (seen === undefined) {
        specs.set(name, { spec, item: item.name });
      } else if (seen.spec !== spec) {
        issues.push({
          item: item.name,
          message: `depends on "${spec}" while "${seen.item}" depends on "${seen.spec}" — one spec per package`,
        });
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
