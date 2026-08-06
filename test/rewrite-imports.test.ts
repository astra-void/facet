import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, type FacetConfig } from "../packages/tools/cli/src/core/config";
import { rewriteImports } from "../packages/tools/cli/src/core/transform/rewriteImports";

/**
 * The rewrite is the one transformation `facet add` performs on a component's
 * text, and it is the one that fails in someone else's project rather than
 * here: registry sources address each other through `~/`, which resolves in
 * this repo and nowhere else.
 */

const aliased: FacetConfig = {
  ...DEFAULT_CONFIG,
  aliases: {
    ui: { dir: "src/shared/ui", import: "shared/ui" },
    lib: { dir: "src/shared/lib", import: "shared/lib" },
    hooks: { dir: "src/shared/hooks", import: "shared/hooks" },
  },
};

describe("rewriteImports", () => {
  it("writes a relative path when the project has no import alias", () => {
    const source = `import { cn } from "~/lib/utils";`;
    expect(rewriteImports(source, DEFAULT_CONFIG, "src/shared/ui")).toBe(`import { cn } from "../lib/utils";`);
  });

  it("keeps a same-directory import explicitly relative", () => {
    const source = `import { TextSlot } from "~/lib/text";`;
    expect(rewriteImports(source, DEFAULT_CONFIG, "src/shared/lib")).toBe(`import { TextSlot } from "./text";`);
  });

  it("uses the alias when the project configured one", () => {
    const source = `import { cn } from "~/lib/utils";`;
    expect(rewriteImports(source, aliased, "src/shared/ui")).toBe(`import { cn } from "shared/lib/utils";`);
  });

  it("follows the project's directories rather than the registry's", () => {
    const config: FacetConfig = {
      ...DEFAULT_CONFIG,
      aliases: { ...DEFAULT_CONFIG.aliases, lib: { dir: "src/client/helpers" } },
    };
    expect(rewriteImports(`import { cn } from "~/lib/utils";`, config, "src/shared/ui")).toBe(
      `import { cn } from "../../client/helpers/utils";`,
    );
  });

  it("rewrites every occurrence and both quote styles", () => {
    const source = ['import { cn } from "~/lib/utils";', "import { TextSlot } from '~/lib/text';"].join("\n");
    expect(rewriteImports(source, DEFAULT_CONFIG, "src/shared/ui")).toBe(
      ['import { cn } from "../lib/utils";', "import { TextSlot } from '../lib/text';"].join("\n"),
    );
  });

  it("leaves imports that are not the registry's alone", () => {
    const source = [
      'import { React } from "@lattice-ui/react-runtime";',
      'import { fv } from "@facet-ui/react-variants";',
    ].join("\n");
    expect(rewriteImports(source, DEFAULT_CONFIG, "src/shared/ui")).toBe(source);
  });

  it("leaves an unknown alias segment to fail at typecheck rather than rewriting it wrongly", () => {
    const source = `import { thing } from "~/widgets/thing";`;
    expect(rewriteImports(source, DEFAULT_CONFIG, "src/shared/ui")).toBe(source);
  });
});
