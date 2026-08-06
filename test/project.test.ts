import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, type FacetConfig } from "../packages/tools/cli/src/core/config";
import { missingDependencies } from "../packages/tools/cli/src/core/pm";
import { inspectPackages, installedVersion } from "../packages/tools/cli/src/core/project/packages";
import { inspectAliasPath, inspectTransformer } from "../packages/tools/cli/src/core/project/tsconfig";
import { inspectVelaConfig } from "../packages/tools/cli/src/core/project/velaConfig";
import { createProject, type Fixture, TSCONFIG_WITH_TRANSFORMER } from "./support/project";

let fixture: Fixture | undefined;

afterEach(async () => {
  await fixture?.cleanup();
  fixture = undefined;
});

describe("inspectTransformer", () => {
  it("sees the transformer through the comments a JSON parser would choke on", async () => {
    fixture = await createProject({ "tsconfig.json": TSCONFIG_WITH_TRANSFORMER });
    expect(await inspectTransformer(fixture.root)).toBe("present");
  });

  it("reports a tsconfig without it, since every class would be inert", async () => {
    fixture = await createProject({ "tsconfig.json": `{ "compilerOptions": {} }` });
    expect(await inspectTransformer(fixture.root)).toBe("absent");
  });

  it("says so rather than guessing when there is no tsconfig to read", async () => {
    fixture = await createProject();
    expect(await inspectTransformer(fixture.root)).toBe("unreadable");
  });
});

describe("inspectAliasPath", () => {
  it("accepts the wildcard key that covers the specifier", async () => {
    fixture = await createProject({
      "tsconfig.json": `{ "compilerOptions": { "paths": { "shared/*": ["src/shared/*"] } } }`,
    });
    expect(await inspectAliasPath(fixture.root, "shared/ui")).toBe("declared");
  });

  it("accepts the specifier spelled out", async () => {
    fixture = await createProject({
      "tsconfig.json": `{ "compilerOptions": { "paths": { "shared/ui": ["src/shared/ui"] } } }`,
    });
    expect(await inspectAliasPath(fixture.root, "shared/ui")).toBe("declared");
  });

  it("does not accept a paths entry for something else", async () => {
    fixture = await createProject({
      "tsconfig.json": `{ "compilerOptions": { "paths": { "server/*": ["src/server/*"] } } }`,
    });
    expect(await inspectAliasPath(fixture.root, "shared/ui")).toBe("absent");
  });
});

describe("inspectVelaConfig", () => {
  const config: FacetConfig = DEFAULT_CONFIG;

  it("offers a config to write when there is none", async () => {
    fixture = await createProject();
    const state = await inspectVelaConfig(fixture.root, config);
    expect(state.kind).toBe("missing");
    expect(state.kind === "missing" && state.content).toContain('facetTheme({ base: "zinc", mode: "dark" })');
  });

  it("counts a config that spreads facetTheme as wired", async () => {
    fixture = await createProject({
      "vela.config.ts": `import { facetTheme } from "@facet-ui/theme";\nexport default {};\n`,
    });
    expect((await inspectVelaConfig(fixture.root, config)).kind).toBe("wired");
  });

  it("hands back a hand-rolled config's text rather than rewriting it", async () => {
    const source = `export default { theme: { extend: { colors: { primary: "#fff" } } } };\n`;
    fixture = await createProject({ "vela.config.ts": source });

    const state = await inspectVelaConfig(fixture.root, config);
    expect(state.kind).toBe("unwired");
    expect(state.kind === "unwired" && state.source).toBe(source);
  });
});

describe("installedVersion", () => {
  it("reads the version out of the installed package", async () => {
    fixture = await createProject();
    await fixture.install("vela-rbxts", "0.9.1");
    expect(await installedVersion(fixture.root, "vela-rbxts")).toBe("0.9.1");
  });

  it("finds a dependency hoisted above the project", async () => {
    fixture = await createProject();
    await fixture.install("vela-rbxts", "0.9.1");
    await fixture.write("apps/game/package.json", "{}");
    expect(await installedVersion(`${fixture.root}/apps/game`, "vela-rbxts")).toBe("0.9.1");
  });

  it("is undefined for something that is not installed", async () => {
    fixture = await createProject();
    expect(await installedVersion(fixture.root, "vela-rbxts")).toBeUndefined();
  });
});

describe("inspectPackages", () => {
  it("reports the version the project has, not the range it declared", async () => {
    fixture = await createProject({
      "package.json": JSON.stringify({ devDependencies: { "vela-rbxts": "^0.9.0" } }),
    });
    // The lockfile is what decides; a range that would allow 0.9 says nothing
    // about a project that installed once, back when 0.7 was current.
    await fixture.install("vela-rbxts", "0.7.4");

    const [report] = await inspectPackages(fixture.root, new Map([["vela-rbxts@^0.9.0", ["the build"]]]));
    expect(report).toMatchObject({
      name: "vela-rbxts",
      floor: "0.9.0",
      declared: "^0.9.0",
      installed: "0.7.4",
      status: "below-floor",
      neededBy: ["the build"],
    });
  });

  it("passes a package at or above its floor", async () => {
    fixture = await createProject({ "package.json": JSON.stringify({ dependencies: { "vela-rbxts": "^0.9.0" } }) });
    await fixture.install("vela-rbxts", "0.9.2");

    const [report] = await inspectPackages(fixture.root, new Map([["vela-rbxts@^0.9.0", ["the build"]]]));
    expect(report?.status).toBe("ok");
  });

  it("falls back to the declared range for a project that has not installed yet", async () => {
    fixture = await createProject({ "package.json": JSON.stringify({ devDependencies: { "vela-rbxts": "^0.7.0" } }) });

    const [report] = await inspectPackages(fixture.root, new Map([["vela-rbxts@^0.9.0", ["the build"]]]));
    expect(report?.status).toBe("below-floor");
  });

  it("admits a range it cannot compare rather than failing it", async () => {
    fixture = await createProject({ "package.json": JSON.stringify({ dependencies: { "vela-rbxts": "latest" } }) });

    const [report] = await inspectPackages(fixture.root, new Map([["vela-rbxts@^0.9.0", ["the build"]]]));
    expect(report?.status).toBe("unverifiable");
  });

  it("calls a package neither declared nor installed missing", async () => {
    fixture = await createProject();

    const [report] = await inspectPackages(fixture.root, new Map([["vela-rbxts@^0.9.0", ["the build"]]]));
    expect(report?.status).toBe("missing");
  });
});

describe("missingDependencies", () => {
  it("counts a declared dependency as present whatever version it is on", async () => {
    fixture = await createProject({
      "package.json": JSON.stringify({ devDependencies: { "vela-rbxts": "^0.7.0" } }),
    });

    // A floor here is for new installs; upgrading someone's pinned dependency
    // behind their back is `doctor`'s business to report, not `add`'s to do.
    expect(await missingDependencies(fixture.root, ["vela-rbxts@^0.9.0", "@facet-ui/theme"])).toEqual([
      "@facet-ui/theme",
    ]);
  });
});
