import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, type FacetConfig } from "../packages/tools/cli/src/core/config";
import { destinationFor, destinationForIndexFile } from "../packages/tools/cli/src/core/registry/destination";
import { collectDependencies, resolveItems } from "../packages/tools/cli/src/core/registry/resolve";
import type { Registry, RegistryIndex, RegistryIndexEntry } from "../packages/tools/cli/src/core/registry/schema";
import { validateRegistry } from "../packages/tools/cli/src/core/registry/schema";

function entry(overrides: Partial<RegistryIndexEntry> & { name: string }): RegistryIndexEntry {
  return { type: "registry:ui", files: [`ui/${overrides.name}.tsx`], ...overrides };
}

function index(items: RegistryIndexEntry[]): RegistryIndex {
  return { version: 1, generatedBy: "test", items };
}

describe("validateRegistry", () => {
  it("passes a well-formed registry", () => {
    const registry: Registry = [
      { name: "utils", type: "registry:lib", files: [{ path: "lib/utils.ts", type: "registry:lib" }] },
      {
        name: "button",
        type: "registry:ui",
        files: [{ path: "ui/button.tsx", type: "registry:ui" }],
        registryDependencies: ["utils"],
      },
    ];

    expect(validateRegistry(registry)).toEqual([]);
  });

  it("catches a registry dependency that does not exist", () => {
    const registry: Registry = [
      {
        name: "button",
        type: "registry:ui",
        files: [{ path: "ui/button.tsx", type: "registry:ui" }],
        registryDependencies: ["utils"],
      },
    ];

    expect(validateRegistry(registry)).toEqual([
      { item: "button", message: 'registry dependency "utils" does not exist' },
    ]);
  });

  it("catches two items claiming one file", () => {
    const registry: Registry = [
      { name: "button", type: "registry:ui", files: [{ path: "ui/button.tsx", type: "registry:ui" }] },
      { name: "cta", type: "registry:ui", files: [{ path: "ui/button.tsx", type: "registry:ui" }] },
    ];

    expect(validateRegistry(registry)).toEqual([
      { item: "cta", message: 'file "ui/button.tsx" is already owned by "button"' },
    ]);
  });

  it("catches an item that declares no files", () => {
    expect(validateRegistry([{ name: "ghost", type: "registry:ui", files: [] }])).toEqual([
      { item: "ghost", message: "item declares no files" },
    ]);
  });

  it("catches one package spelled two ways, which `facet add` would install twice", () => {
    const registry: Registry = [
      {
        name: "text",
        type: "registry:lib",
        files: [{ path: "lib/text.tsx", type: "registry:lib" }],
        dependencies: ["@lattice-ui/react-runtime@^0.8.0"],
      },
      {
        name: "button",
        type: "registry:ui",
        files: [{ path: "ui/button.tsx", type: "registry:ui" }],
        dependencies: ["@lattice-ui/react-runtime"],
      },
    ];

    expect(validateRegistry(registry)).toEqual([
      {
        item: "button",
        message:
          'depends on "@lattice-ui/react-runtime" while "text" depends on "@lattice-ui/react-runtime@^0.8.0" — one spec per package',
      },
    ]);
  });

  it("is happy when every item spells a shared package the same way", () => {
    const registry: Registry = [
      {
        name: "text",
        type: "registry:lib",
        files: [{ path: "lib/text.tsx", type: "registry:lib" }],
        dependencies: ["@lattice-ui/react-runtime@^0.8.0"],
      },
      {
        name: "button",
        type: "registry:ui",
        files: [{ path: "ui/button.tsx", type: "registry:ui" }],
        dependencies: ["@lattice-ui/react-runtime@^0.8.0"],
      },
    ];

    expect(validateRegistry(registry)).toEqual([]);
  });
});

describe("resolveItems", () => {
  const registry = index([
    entry({ name: "utils", type: "registry:lib", files: ["lib/utils.ts"] }),
    entry({ name: "text", type: "registry:lib", files: ["lib/text.tsx"] }),
    entry({ name: "button", registryDependencies: ["utils", "text"] }),
    entry({ name: "card", registryDependencies: ["utils"] }),
  ]);

  it("puts dependencies before the things that import them", () => {
    expect(resolveItems(registry, ["button"]).map((item) => item.name)).toEqual(["utils", "text", "button"]);
  });

  it("installs a shared dependency once", () => {
    expect(resolveItems(registry, ["button", "card"]).map((item) => item.name)).toEqual([
      "utils",
      "text",
      "button",
      "card",
    ]);
  });

  it("names the component that asked for a missing one", () => {
    const broken = index([entry({ name: "button", registryDependencies: ["nope"] })]);
    expect(() => resolveItems(broken, ["button"])).toThrow(/"nope".*required by "button"/);
  });

  it("refuses to loop forever on a cycle", () => {
    const cyclic = index([
      entry({ name: "a", registryDependencies: ["b"] }),
      entry({ name: "b", registryDependencies: ["a"] }),
    ]);
    expect(() => resolveItems(cyclic, ["a"])).toThrow(/Circular registry dependency: a -> b -> a/);
  });

  it("points a typo at `facet list` rather than at nothing", () => {
    expect(() => resolveItems(registry, ["buton"])).toThrow(/Unknown component "buton"\. Run `facet list`/);
  });
});

describe("collectDependencies", () => {
  it("unions and sorts, keeping each package once", () => {
    const items = [
      entry({ name: "button", dependencies: ["@lattice-ui/react-runtime@^0.8.0"], tokens: ["primary", "border"] }),
      entry({
        name: "card",
        dependencies: ["@lattice-ui/react-runtime@^0.8.0", "@facet-ui/react-variants@^0.1.1"],
        tokens: ["border"],
      }),
    ];

    expect(collectDependencies(items)).toEqual({
      dependencies: ["@facet-ui/react-variants@^0.1.1", "@lattice-ui/react-runtime@^0.8.0"],
      devDependencies: [],
      tokens: ["border", "primary"],
    });
  });
});

describe("destinationFor", () => {
  it("drops the registry's alias segment and keeps the rest", () => {
    expect(destinationFor(DEFAULT_CONFIG, { path: "ui/button.tsx", type: "registry:ui" })).toEqual({
      path: "src/shared/ui/button.tsx",
      dir: "src/shared/ui",
    });
  });

  it("keeps a nested path nested rather than flattening it into the alias root", () => {
    expect(destinationFor(DEFAULT_CONFIG, { path: "ui/login/form.tsx", type: "registry:ui" })).toEqual({
      path: "src/shared/ui/login/form.tsx",
      dir: "src/shared/ui/login",
    });
  });

  it("lets an explicit target win", () => {
    expect(
      destinationFor(DEFAULT_CONFIG, { path: "ui/button.tsx", type: "registry:ui", target: "src/client/button.tsx" }),
    ).toEqual({ path: "src/client/button.tsx", dir: "src/client" });
  });

  it("follows the project's own directories", () => {
    const config: FacetConfig = {
      ...DEFAULT_CONFIG,
      aliases: { ...DEFAULT_CONFIG.aliases, ui: { dir: "src/gui/components" } },
    };
    expect(destinationFor(config, { path: "ui/button.tsx", type: "registry:ui" }).path).toBe(
      "src/gui/components/button.tsx",
    );
  });
});

describe("destinationForIndexFile", () => {
  it("takes the alias from the path, which is all the index carries", () => {
    expect(destinationForIndexFile(DEFAULT_CONFIG, "lib/utils.ts", "registry:lib").path).toBe(
      "src/shared/lib/utils.ts",
    );
  });

  it("reads a lib file inside a ui item as a lib file", () => {
    expect(destinationForIndexFile(DEFAULT_CONFIG, "lib/text.tsx", "registry:ui").path).toBe("src/shared/lib/text.tsx");
  });

  it("falls back to the item's own type for a path it does not recognise", () => {
    expect(destinationForIndexFile(DEFAULT_CONFIG, "blocks/login/form.tsx", "registry:block").path).toBe(
      "src/shared/ui/login/form.tsx",
    );
  });
});
