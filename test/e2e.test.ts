import { execFile } from "node:child_process";
import { mkdtemp, readFile, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { add } from "../packages/tools/cli/src/commands/add";
import { diff } from "../packages/tools/cli/src/commands/diff";
import { doctor } from "../packages/tools/cli/src/commands/doctor";
import { init } from "../packages/tools/cli/src/commands/init";
import { remove } from "../packages/tools/cli/src/commands/remove";
import { createProject, type Fixture, TSCONFIG_WITH_TRANSFORMER } from "./support/project";

/**
 * The end-to-end check the roadmap wanted to stop doing by hand: build the
 * registry, then put a project through `init`, `add` and `doctor` against it.
 *
 * It runs offline. `noDeps` skips every install, and the packages a component
 * needs are faked into `node_modules` at chosen versions — which is the only
 * way to assert on the case this is really here for, a project sitting below a
 * floor. What it does not cover is `rbxtsc` actually compiling the result; the
 * playground build is what checks that.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const run = promisify(execFile);

let registryDir: string;
let fixture: Fixture;
let output: string[];

beforeAll(async () => {
  const site = await realpath(await mkdtemp(path.join(tmpdir(), "facet-registry-")));
  await run("node", ["--import", "tsx", "scripts/build-registry.ts", "--out", site], { cwd: ROOT });
  registryDir = path.join(site, "r");
}, 60_000);

afterAll(async () => {
  await rm(path.dirname(registryDir), { recursive: true, force: true });
});

beforeEach(async () => {
  fixture = await createProject({ "tsconfig.json": TSCONFIG_WITH_TRANSFORMER });
  output = [];
  for (const method of ["log", "warn", "error"] as const) {
    vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
      output.push(args.join(" "));
    });
  }
});

afterEach(async () => {
  vi.restoreAllMocks();
  await fixture.cleanup();
});

/** Everything the CLI printed since the fixture was created. */
function printed(): string {
  return output.join("\n");
}

async function setUp(): Promise<void> {
  await init({ cwd: fixture.root, yes: true, noDeps: true, registry: registryDir });
}

/** The versions the registry's floors ask for, as though they had been installed. */
async function installFloors(): Promise<void> {
  await fixture.install("@facet-ui/theme", "0.2.0");
  await fixture.install("vela-rbxts", "0.9.0");
  await fixture.install("@facet-ui/react-variants", "0.2.0");
  await fixture.install("@lattice-ui/react-runtime", "0.8.0");
}

describe("registry build", () => {
  it("puts the schema facet.json advertises at the site root", async () => {
    // `$schema` in a written facet.json is an absolute URL at the site root, so
    // the deploy that publishes the registry has to publish this too.
    const site = path.dirname(registryDir);
    const schema = JSON.parse(await readFile(path.join(site, "schema.json"), "utf8")) as { $id: string };

    await setUp();
    const config = JSON.parse(await fixture.read("facet.json")) as { $schema: string };
    expect(schema.$id).toBe(config.$schema);
  });
});

describe("facet init", () => {
  it("leaves a project that can take a component", async () => {
    await setUp();

    expect(JSON.parse(await fixture.read("facet.json"))).toMatchObject({
      style: "default",
      theme: { base: "zinc", mode: "dark" },
      aliases: { ui: { dir: "src/shared/ui" } },
    });
    expect(await fixture.read("vela.config.ts")).toContain('facetTheme({ base: "zinc", mode: "dark" })');
    // `cn` is what every component imports, so it is part of being set up
    // rather than something to discover on the first failed build.
    expect(await fixture.read("src/shared/lib/utils.ts")).toContain('cn } from "@facet-ui/react-variants"');
  });
});

describe("facet add", () => {
  it("copies a component with its registry dependencies", async () => {
    await setUp();
    await add(["button"], { cwd: fixture.root, noDeps: true, registry: registryDir });

    await expect(fixture.read("src/shared/ui/button.tsx")).resolves.toContain("export function Button");
    await expect(fixture.read("src/shared/lib/text.tsx")).resolves.toContain("TextSlot");
  });

  it("rewrites every `~/` import for where the file actually landed", async () => {
    await setUp();
    await add(["button"], { cwd: fixture.root, noDeps: true, registry: registryDir });

    const button = await fixture.read("src/shared/ui/button.tsx");
    expect(button).toContain('from "../lib/utils"');
    expect(button).toContain('from "../lib/text"');
    // A `~/` that survives into someone's project is an import that resolves
    // in this repo and nowhere else.
    expect(button).not.toContain("~/");
  });

  it("leaves a file it has already written alone unless told otherwise", async () => {
    await setUp();
    await add(["button"], { cwd: fixture.root, noDeps: true, registry: registryDir });
    await fixture.write("src/shared/ui/button.tsx", "// mine now\n");

    await add(["button"], { cwd: fixture.root, noDeps: true, registry: registryDir });
    expect(await fixture.read("src/shared/ui/button.tsx")).toBe("// mine now\n");

    await add(["button"], { cwd: fixture.root, noDeps: true, overwrite: true, registry: registryDir });
    expect(await fixture.read("src/shared/ui/button.tsx")).toContain("export function Button");
  });

  it("refuses a name the registry does not have, without writing anything", async () => {
    await setUp();
    await expect(add(["buton"], { cwd: fixture.root, noDeps: true, registry: registryDir })).rejects.toThrow(
      /Unknown component "buton"/,
    );
    await expect(fixture.read("src/shared/ui/buton.tsx")).rejects.toThrow();
  });
});

describe("facet remove", () => {
  it("deletes a component it recognises as untouched", async () => {
    await setUp();
    await add(["card"], { cwd: fixture.root, noDeps: true, registry: registryDir });

    await remove(["card"], { cwd: fixture.root, registry: registryDir });
    await expect(fixture.read("src/shared/ui/card.tsx")).rejects.toThrow();
    // `utils` came in behind `card` and stays: removing is not the inverse of
    // adding, because something else may have arrived in the meantime.
    await expect(fixture.read("src/shared/lib/utils.ts")).resolves.toContain("cn");
  });

  it("keeps a file another installed component still imports, force or not", async () => {
    await setUp();
    await add(["button"], { cwd: fixture.root, noDeps: true, registry: registryDir });

    await remove(["utils"], { cwd: fixture.root, registry: registryDir });
    expect(printed()).toContain("utils is still imported by button");
    await expect(fixture.read("src/shared/lib/utils.ts")).resolves.toBeTruthy();

    await remove(["utils"], { cwd: fixture.root, force: true, registry: registryDir });
    await expect(fixture.read("src/shared/lib/utils.ts")).resolves.toBeTruthy();
  });

  it("keeps a component the project has edited, until told otherwise", async () => {
    await setUp();
    await add(["card"], { cwd: fixture.root, noDeps: true, registry: registryDir });
    await fixture.write("src/shared/ui/card.tsx", `${await fixture.read("src/shared/ui/card.tsx")}// mine\n`);

    await remove(["card"], { cwd: fixture.root, registry: registryDir });
    expect(printed()).toContain("card differs from the registry");
    await expect(fixture.read("src/shared/ui/card.tsx")).resolves.toContain("// mine");

    await remove(["card"], { cwd: fixture.root, force: true, registry: registryDir });
    await expect(fixture.read("src/shared/ui/card.tsx")).rejects.toThrow();
  });

  it("counts a component that only ever moved upstream as edited, and says so", async () => {
    await setUp();
    await add(["card"], { cwd: fixture.root, noDeps: true, registry: registryDir });
    await fixture.write("src/shared/ui/card.tsx", "// upstream rewrote this, not me\n");

    await remove(["card"], { cwd: fixture.root, registry: registryDir });
    // Nothing is recorded at copy time, so this case is indistinguishable from
    // an edit — see docs/decisions/provenance.md. The output must not claim it
    // knows which happened.
    expect(printed()).toContain("Upstream may have moved instead");
  });

  it("re-blocks a dependency when the component that imports it turns out to stay", async () => {
    await setUp();
    await add(["button"], { cwd: fixture.root, noDeps: true, registry: registryDir });
    await fixture.write("src/shared/ui/button.tsx", `${await fixture.read("src/shared/ui/button.tsx")}// mine\n`);

    // Both were asked for, so `utils` looks free — until `button` is kept for
    // being modified, at which point it is importing `utils` again.
    await remove(["button", "utils"], { cwd: fixture.root, registry: registryDir });
    expect(printed()).toContain("utils is still imported by button");
    await expect(fixture.read("src/shared/lib/utils.ts")).resolves.toBeTruthy();
  });

  it("removes a dependency once nothing is left importing it", async () => {
    await setUp();
    await add(["button"], { cwd: fixture.root, noDeps: true, registry: registryDir });

    await remove(["button", "utils", "text"], { cwd: fixture.root, registry: registryDir });
    await expect(fixture.read("src/shared/ui/button.tsx")).rejects.toThrow();
    await expect(fixture.read("src/shared/lib/utils.ts")).rejects.toThrow();
    await expect(fixture.read("src/shared/lib/text.tsx")).rejects.toThrow();
  });

  it("says a component is not installed rather than pretending to remove it", async () => {
    await setUp();
    await remove(["card"], { cwd: fixture.root, registry: registryDir });
    expect(printed()).toContain("card is not installed");
    expect(printed()).toContain("Nothing removed.");
  });

  it("refuses a name the registry does not have", async () => {
    await setUp();
    await expect(remove(["carrd"], { cwd: fixture.root, registry: registryDir })).rejects.toThrow(
      /Unknown component "carrd"/,
    );
  });
});

describe("facet diff", () => {
  it("says a freshly copied component matches", async () => {
    await setUp();
    await add(["label"], { cwd: fixture.root, noDeps: true, registry: registryDir });

    await diff(undefined, { cwd: fixture.root, registry: registryDir });
    expect(printed()).toContain("match the registry");
  });

  it("shows the change, in the direction that makes `+` the project's", async () => {
    await setUp();
    await add(["label"], { cwd: fixture.root, noDeps: true, registry: registryDir });
    const source = await fixture.read("src/shared/ui/label.tsx");
    await fixture.write("src/shared/ui/label.tsx", source.replace("text-sm", "text-lg"));

    await diff(undefined, { cwd: fixture.root, registry: registryDir });
    expect(printed()).toContain("-export const labelVariants");
    expect(printed()).toContain("text-lg");
    expect(printed()).toContain("src/shared/ui/label.tsx");
  });

  it("refuses to say which side moved, because it cannot know", async () => {
    await setUp();
    await add(["label"], { cwd: fixture.root, noDeps: true, registry: registryDir });
    await fixture.write("src/shared/ui/label.tsx", "// nothing like the original\n");

    await diff(undefined, { cwd: fixture.root, registry: registryDir });
    expect(printed()).toContain("your edit, a change");
    expect(printed()).toContain("Facet cannot tell them apart");
  });

  it("does not report the alias rewrite `add` performed as a difference", async () => {
    // The file on disk imports `../lib/utils`; the registry source says
    // `~/lib/utils`. Comparing without replaying the rewrite would report every
    // component as changed the moment it was copied.
    await setUp();
    await add(["button"], { cwd: fixture.root, noDeps: true, registry: registryDir });

    await diff("button", { cwd: fixture.root, registry: registryDir });
    expect(printed()).not.toContain("~/lib/utils");
    expect(printed()).toContain("match the registry");
  });

  it("walks only what the project has", async () => {
    await setUp();
    await add(["label"], { cwd: fixture.root, noDeps: true, registry: registryDir });

    await diff(undefined, { cwd: fixture.root, registry: registryDir });
    expect(printed()).not.toContain("card");
  });

  it("says so for a component that is not installed", async () => {
    await setUp();
    await diff("card", { cwd: fixture.root, registry: registryDir });
    expect(printed()).toContain("card is not installed");
  });

  it("refuses a name the registry does not have", async () => {
    await setUp();
    await expect(diff("carrd", { cwd: fixture.root, registry: registryDir })).rejects.toThrow(
      /Unknown component "carrd"/,
    );
  });
});

describe("facet doctor", () => {
  it("passes a project that has everything the components assume", async () => {
    await setUp();
    await add(["button", "card"], { cwd: fixture.root, noDeps: true, registry: registryDir });
    await installFloors();

    await expect(doctor({ cwd: fixture.root, registry: registryDir })).resolves.toBeUndefined();
    expect(printed()).toContain("This project is set up the way components assume");
    expect(printed()).toContain("installed: utils, text, button, card");
  });

  it("catches the Vela that cannot build what was just copied into the project", async () => {
    await setUp();
    await add(["card"], { cwd: fixture.root, noDeps: true, registry: registryDir });
    await installFloors();
    await fixture.install("vela-rbxts", "0.7.4");

    await expect(doctor({ cwd: fixture.root, registry: registryDir })).rejects.toThrow(/1 check failed/);
    expect(printed()).toContain("vela-rbxts 0.7.4 (needs >=0.9.0)");
  });

  it("catches a Lattice too old for the components that import it", async () => {
    await setUp();
    await add(["button"], { cwd: fixture.root, noDeps: true, registry: registryDir });
    await installFloors();
    await fixture.install("@lattice-ui/react-runtime", "0.7.2");

    await expect(doctor({ cwd: fixture.root, registry: registryDir })).rejects.toThrow();
    expect(printed()).toContain("@lattice-ui/react-runtime 0.7.2 (needs >=0.8.0) — for text, button");
  });

  it("names the tokens a hand-rolled theme leaves undefined", async () => {
    await setUp();
    await add(["card"], { cwd: fixture.root, noDeps: true, registry: registryDir });
    await installFloors();
    await fixture.write(
      "vela.config.ts",
      `export default { theme: { extend: { colors: { card: "#111", "card-foreground": "#fff" } } } };\n`,
    );

    await expect(doctor({ cwd: fixture.root, registry: registryDir })).rejects.toThrow();
    // `border` and `muted-foreground` are missing; `card` and `card-foreground`
    // are defined by hand and must not be reported.
    const tokens = printed().match(/token\(s\) installed components name are not defined: (.*)/)?.[1];
    expect(tokens?.split(", ").sort()).toEqual(["border", "muted-foreground"]);
  });

  it("reports the transformer a project forgot", async () => {
    await setUp();
    await installFloors();
    await fixture.write("tsconfig.json", `{ "compilerOptions": {} }`);

    await expect(doctor({ cwd: fixture.root, registry: registryDir })).rejects.toThrow();
    expect(printed()).toContain("does not register vela-rbxts/transformer");
  });

  it("answers what it can when the registry is unreachable", async () => {
    await setUp();
    await installFloors();

    await expect(
      doctor({ cwd: fixture.root, registry: path.join(fixture.root, "no-registry-here") }),
    ).resolves.toBeUndefined();
    expect(printed()).toContain("could not read the registry");
    expect(printed()).toContain("vela-rbxts/transformer is registered");
  });

  it("sends someone with no facet.json to init rather than reporting on nothing", async () => {
    await expect(doctor({ cwd: fixture.root, registry: registryDir })).rejects.toThrow(/Run `facet init` first/);
  });
});
