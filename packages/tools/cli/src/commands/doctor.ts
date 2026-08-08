import { access } from "node:fs/promises";
import path from "node:path";
import { FACET_TOKENS } from "@facet-ui/theme";
import { CONFIG_FILENAME, type FacetConfig, readConfig } from "../core/config.js";
import { FacetError, isUserFacing } from "../core/errors.js";
import { logger } from "../core/logger.js";
import { compareVersions, minimumVersion, parseSpec } from "../core/pkgspec.js";
import { findClientEntry, planProvider, providerSnippet } from "../core/project/entry.js";
import { findProjectRoot } from "../core/project/findRoot.js";
import { inspectPackages, type PackageReport } from "../core/project/packages.js";
import { inspectAliasPath, inspectTransformer, TRANSFORMER_SNIPPET } from "../core/project/tsconfig.js";
import { inspectVelaConfig } from "../core/project/velaConfig.js";
import { destinationForIndexFile } from "../core/registry/destination.js";
import { loadIndex } from "../core/registry/load.js";
import { collectProviders } from "../core/registry/resolve.js";
import type { RegistryIndex, RegistryIndexEntry } from "../core/registry/schema.js";
import { describeSource, resolveRegistrySource } from "../core/registry/source.js";
import { BUILD_DEPENDENCIES } from "../core/requirements.js";

export type DoctorOptions = {
  cwd?: string;
  registry?: string;
};

type Severity = "ok" | "warn" | "fail";

type Check = {
  severity: Severity;
  label: string;
  detail: string;
  /** Dimmed lines under the check — what to do about it. */
  notes?: string[];
};

/** What each installed item's files turned out to be. */
type ItemState = {
  entry: RegistryIndexEntry;
  present: string[];
  missing: string[];
};

/** Label used for packages the toolchain needs rather than any one component. */
const TOOLCHAIN = "the build";

async function exists(candidate: string): Promise<boolean> {
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
  }
}

/**
 * Which registry items this project has files from.
 *
 * An item counts as present the moment one of its files does. A copied file is
 * the consumer's to delete, so a half-installed item is a thing to report, not
 * a reason to decide the item is not there — its tokens and its packages are
 * still needed by whatever is left.
 */
async function installedItems(root: string, config: FacetConfig, index: RegistryIndex): Promise<ItemState[]> {
  const states: ItemState[] = [];

  for (const entry of index.items) {
    const present: string[] = [];
    const missing: string[] = [];

    for (const file of entry.files) {
      const destination = destinationForIndexFile(config, file, entry.type);
      if (await exists(path.resolve(root, destination.path))) {
        present.push(destination.path);
      } else {
        missing.push(destination.path);
      }
    }

    if (present.length > 0) {
      states.push({ entry, present, missing });
    }
  }

  return states;
}

/**
 * Collects `name@range` specs, keeping the highest floor when two callers ask
 * for the same package. The registry is validated to use one spec per package,
 * so this only ever arbitrates between the registry and the toolchain list.
 */
function need(needs: Map<string, { spec: string; neededBy: string[] }>, spec: string, by: string): void {
  const { name, range } = parseSpec(spec);
  const seen = needs.get(name);

  if (seen === undefined) {
    needs.set(name, { spec, neededBy: [by] });
    return;
  }

  if (!seen.neededBy.includes(by)) {
    seen.neededBy.push(by);
  }

  const floor = range === undefined ? undefined : minimumVersion(range);
  const seenFloor = parseSpec(seen.spec).range;
  const seenMinimum = seenFloor === undefined ? undefined : minimumVersion(seenFloor);

  if (floor !== undefined && (seenMinimum === undefined || (compareVersions(floor, seenMinimum) ?? 0) > 0)) {
    seen.spec = spec;
  }
}

function describePackage(report: PackageReport): string {
  const version = report.installed ?? report.declared ?? "not installed";
  const floor = report.floor === undefined ? "" : ` (needs >=${report.floor})`;
  return `${report.name} ${version}${floor} — for ${report.neededBy.join(", ")}`;
}

/**
 * Whether a Vela config that does not spread `facetTheme` defines a token
 * anyway, by looking for it as a color key.
 *
 * A plain substring search is not enough: `"primary-foreground"` contains
 * `foreground`, and reading that as a definition would clear a token the theme
 * never defines. So the token has to appear either quoted exactly or as an
 * unquoted key with nothing word-like on either side of it.
 *
 * Still a text search, for the reason `inspectVelaConfig` does not rewrite the
 * file: a Vela config is arbitrary TypeScript, and the alternative to reading
 * it as text is evaluating it.
 */
function namesToken(source: string, token: string): boolean {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(["'\`])${escaped}\\1|(?<![\\w-])${escaped}(?![\\w-])\\s*:`).test(source);
}

function render(checks: Check[]): void {
  const width = checks.reduce((longest, check) => Math.max(longest, check.label.length), 0);

  for (const check of checks) {
    const line = `${check.label.padEnd(width)}  ${check.detail}`;
    if (check.severity === "ok") {
      logger.success(line);
    } else if (check.severity === "warn") {
      logger.warn(line);
    } else {
      logger.error(line);
    }

    for (const note of check.notes ?? []) {
      logger.dim(`    ${note}`);
    }
  }
}

export async function doctor(options: DoctorOptions = {}): Promise<void> {
  const root = await findProjectRoot(options.cwd);
  const config = await readConfig(root);

  const checks: Check[] = [];

  // 1. The config itself, and where it says things live.
  const directories: string[] = [];
  for (const [alias, entry] of Object.entries(config.aliases)) {
    directories.push(
      `${alias}: ${entry.dir}${(await exists(path.resolve(root, entry.dir))) ? "" : " (not created yet)"}`,
    );
  }
  checks.push({
    severity: "ok",
    label: CONFIG_FILENAME,
    detail: `style ${config.style}, theme ${config.theme.base}/${config.theme.mode}`,
    notes: directories,
  });

  // 2. Import aliases, but only for a project that opted into them. The default
  //    is relative imports, which need nothing from tsconfig.
  const aliased = Object.values(config.aliases)
    .map((entry) => entry.import)
    .filter((specifier): specifier is string => specifier !== undefined);

  if (aliased.length > 0) {
    const unresolved: string[] = [];
    let unreadable = false;

    for (const specifier of aliased) {
      const state = await inspectAliasPath(root, specifier);
      if (state === "absent") {
        unresolved.push(specifier);
      } else if (state === "unreadable") {
        unreadable = true;
      }
    }

    if (unreadable) {
      checks.push({
        severity: "warn",
        label: "import alias",
        detail: "could not read tsconfig.json — check these resolve yourself",
        notes: aliased,
      });
    } else if (unresolved.length > 0) {
      checks.push({
        severity: "fail",
        label: "import alias",
        detail: `tsconfig.json declares no paths entry for ${unresolved.join(", ")}`,
        notes: [
          "every copied component imports through these, so the build cannot resolve one of them",
          `add a compilerOptions.paths entry, or clear "import" in ${CONFIG_FILENAME} for relative imports`,
        ],
      });
    } else {
      checks.push({ severity: "ok", label: "import alias", detail: aliased.join(", ") });
    }
  }

  // 3. Without the transformer every className a component sets is inert — the
  //    build succeeds and the UI comes out unstyled.
  const transformer = await inspectTransformer(root);
  if (transformer === "present") {
    checks.push({ severity: "ok", label: "transformer", detail: "vela-rbxts/transformer is registered" });
  } else if (transformer === "unreadable") {
    checks.push({
      severity: "warn",
      label: "transformer",
      detail: "could not read tsconfig.json — check vela-rbxts/transformer is registered yourself",
    });
  } else {
    checks.push({
      severity: "fail",
      label: "transformer",
      detail: "tsconfig.json does not register vela-rbxts/transformer",
      notes: ["without it every class a component sets is inert", ...TRANSFORMER_SNIPPET.split("\n")],
    });
  }

  // 4. The theme. `missing` is fatal on its own; `unwired` is only a problem if
  //    the tokens installed components name are not there some other way, which
  //    the next check decides.
  const vela = await inspectVelaConfig(root, config);
  if (vela.kind === "wired") {
    checks.push({ severity: "ok", label: "theme", detail: `${config.velaConfig} spreads facetTheme` });
  } else if (vela.kind === "missing") {
    checks.push({
      severity: "fail",
      label: "theme",
      detail: `${config.velaConfig} does not exist`,
      notes: ["`facet init` writes one, or create it yourself:", ...vela.content.split("\n")],
    });
  } else {
    checks.push({
      severity: "warn",
      label: "theme",
      detail: `${config.velaConfig} does not use facetTheme`,
      notes: vela.snippet.split("\n"),
    });
  }

  // 5. What the registry knows, if it can be reached. Everything from here on
  //    needs the index; a registry that is down is a gap in the report rather
  //    than the end of it, because the checks above already stand on their own.
  const source = resolveRegistrySource({ registry: options.registry ?? config.registry });
  let index: RegistryIndex | undefined;
  let failure: string | undefined;

  try {
    index = await loadIndex(source);
  } catch (error) {
    failure = isUserFacing(error) ? error.message : String(error);
  }

  const needs = new Map<string, { spec: string; neededBy: string[] }>();
  for (const spec of BUILD_DEPENDENCIES) {
    need(needs, spec, TOOLCHAIN);
  }

  if (index === undefined) {
    checks.push({
      severity: "warn",
      label: "components",
      detail: `could not read the registry at ${describeSource(source)}`,
      notes: [failure ?? "unknown error", "component, token, and per-component package checks were skipped"],
    });
  } else {
    const states = await installedItems(root, config, index);
    const partial = states.filter((state) => state.missing.length > 0);

    for (const state of states) {
      for (const spec of [...(state.entry.dependencies ?? []), ...(state.entry.devDependencies ?? [])]) {
        need(needs, spec, state.entry.name);
      }
    }

    if (states.length === 0) {
      checks.push({
        severity: "ok",
        label: "components",
        detail: "none installed yet — add one with `facet add button`",
      });
    } else if (partial.length === 0) {
      checks.push({
        severity: "ok",
        label: "components",
        detail: `${states.length} installed: ${states.map((state) => state.entry.name).join(", ")}`,
      });
    } else {
      checks.push({
        severity: "warn",
        label: "components",
        detail: `${partial.length} of ${states.length} installed component(s) are missing files`,
        notes: [
          ...partial.map((state) => `${state.entry.name}: ${state.missing.join(", ")}`),
          "deleting a copied file is allowed — this only says the copy is no longer whole",
        ],
      });
    }

    // 6. Tokens. A component naming a token the theme does not define fails at
    //    build time as a Vela diagnostic on a file the consumer never wrote,
    //    which is the single worst error this project can hand someone.
    const required = new Set<string>();
    for (const state of states) {
      for (const token of state.entry.tokens ?? []) {
        required.add(token);
      }
    }

    if (required.size === 0) {
      checks.push({ severity: "ok", label: "tokens", detail: "nothing installed names a token yet" });
    } else {
      // The token set as this CLI knows it, not as the project's installed
      // `@facet-ui/theme` defines it — a project a version behind on the theme
      // is the packages check's problem, and gets a floor there when one of
      // these tokens is ever added.
      const supplied = new Set<string>(FACET_TOKENS);
      // A token the registry names and `@facet-ui/theme` does not define is a
      // Facet bug, not a project one, but it breaks the same build.
      const unknown = [...required].filter((token) => !supplied.has(token));

      // Spreading facetTheme supplies all of them. A config that does not is
      // read as text: naming the token is the most that can be checked without
      // evaluating a file that is arbitrary TypeScript.
      let unresolved: string[];
      if (vela.kind === "wired") {
        unresolved = unknown;
      } else if (vela.kind === "unwired") {
        unresolved = [...required].filter((token) => !namesToken(vela.source, token));
      } else {
        unresolved = [...required];
      }

      if (unresolved.length === 0) {
        checks.push({
          severity: "ok",
          label: "tokens",
          detail: `${required.size} token(s) resolve${vela.kind === "wired" ? "" : " by name in the config"}`,
        });
      } else {
        checks.push({
          severity: "fail",
          label: "tokens",
          detail: `${unresolved.length} token(s) installed components name are not defined: ${unresolved.join(", ")}`,
          notes: [
            ...(vela.kind === "wired"
              ? []
              : [`spread facetTheme into ${config.velaConfig}, or define these colors yourself`]),
            ...(unknown.length > 0
              ? [`${unknown.join(", ")} is not in @facet-ui/theme either — upgrade it, or report this`]
              : []),
          ],
        });
      }
    }

    // 7. Providers. The failure this catches happens at runtime rather than at
    //    build time: a `dialog` with no `PortalProvider` above it compiles,
    //    ships, and throws the first time a player opens it. Nothing in the
    //    copied file can prevent that, because the wiring lives in a file Facet
    //    does not own.
    const providers = collectProviders(states.map((state) => state.entry));
    if (providers.length === 0) {
      checks.push({ severity: "ok", label: "providers", detail: "nothing installed needs one" });
    } else {
      const entries = await findClientEntry(root);
      const entry = entries[0];
      const names = providers.map((provider) => provider.name).join(", ");

      if (entries.length !== 1 || entry === undefined) {
        checks.push({
          severity: "warn",
          label: "providers",
          detail: `could not tell whether ${names} wraps your app`,
          notes: [
            entries.length === 0
              ? "no file under src/ mounts a React tree, so there was nothing to look at"
              : `several files under src/ mount one: ${entries.map((entry) => entry.path).join(", ")}`,
            "check it yourself — installed components need it at runtime, not at build time",
          ],
        });
      } else {
        const missing = providers.filter((provider) => planProvider(entry, provider).kind !== "present");

        if (missing.length === 0) {
          checks.push({ severity: "ok", label: "providers", detail: `${names} wraps ${entry.path}` });
        } else {
          checks.push({
            severity: "fail",
            label: "providers",
            detail: `${entry.path} is not wrapped in ${missing.map((provider) => provider.name).join(", ")}`,
            notes: [
              ...missing.map((provider) => `${provider.name}: ${provider.reason}`),
              "`facet add <component>` offers to write this, or paste:",
              ...missing.flatMap((provider) => providerSnippet(provider).split("\n")),
            ],
          });
        }
      }
    }
  }

  // 8. Packages, last because the registry is what fills most of the list. This
  //    is the check that catches a project set up by an older CLI: the copied
  //    files are current and the versions under them are not.
  const reports = await inspectPackages(
    root,
    new Map([...needs.values()].map((entry) => [entry.spec, entry.neededBy])),
  );
  const broken = reports.filter((report) => report.status === "missing" || report.status === "below-floor");
  const unverifiable = reports.filter((report) => report.status === "unverifiable");

  if (broken.length > 0) {
    checks.push({
      severity: "fail",
      label: "packages",
      detail: `${broken.length} package(s) missing or below the version components need`,
      notes: broken.map(describePackage),
    });
  } else if (unverifiable.length > 0) {
    checks.push({
      severity: "warn",
      label: "packages",
      detail: `${unverifiable.length} package(s) could not be checked against their floor`,
      notes: unverifiable.map(describePackage),
    });
  } else {
    checks.push({
      severity: "ok",
      label: "packages",
      detail: `${reports.length} checked, all at or above their floor`,
    });
  }

  logger.break();
  logger.info(`  ${root}`);
  logger.break();
  render(checks);
  logger.break();

  const failures = checks.filter((check) => check.severity === "fail").length;
  if (failures > 0) {
    throw new FacetError(
      `${failures} check${failures === 1 ? "" : "s"} failed. Fix the above and run \`facet doctor\` again.`,
    );
  }

  const warnings = checks.filter((check) => check.severity === "warn").length;
  logger.success(
    warnings === 0
      ? "This project is set up the way components assume."
      : `Nothing broken, ${warnings} thing(s) worth a look.`,
  );
  logger.break();
}
