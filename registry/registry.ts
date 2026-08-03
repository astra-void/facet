import { defineRegistry } from "../packages/tools/cli/src/core/registry/schema";

/**
 * The authored registry. `pnpm registry:build` reads this, inlines each file's
 * source from `registry/src`, and emits the JSON the published CLI ships.
 *
 * Rules for entries:
 *  - `dependencies` lists npm packages the source imports, exactly. A component
 *    that imports a Lattice primitive must say so, or `facet add` installs a
 *    file that cannot compile.
 *  - `registryDependencies` lists other entries, never files. `utils` is a
 *    dependency of everything that imports `~/lib/utils`.
 *  - `tokens` lists the semantic tokens the classes name, so `facet doctor` can
 *    check them against the consumer's Vela theme.
 */
export default defineRegistry([
  {
    name: "utils",
    type: "registry:lib",
    description: "cn — class composition helper every component imports",
    files: [{ path: "lib/utils.ts", type: "registry:lib" }],
    dependencies: ["@facet-ui/react-variants"],
  },
  {
    name: "button",
    type: "registry:ui",
    description: "Button with variant and size recipes",
    files: [{ path: "ui/button.tsx", type: "registry:ui" }],
    registryDependencies: ["utils"],
    dependencies: ["@facet-ui/react-variants", "@lattice-ui/react-runtime"],
    tokens: [
      "primary",
      "primary-foreground",
      "destructive",
      "destructive-foreground",
      "secondary",
      "secondary-foreground",
      "accent",
      "accent-foreground",
      "background",
      "input",
    ],
  },
]);
