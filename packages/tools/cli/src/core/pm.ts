import { spawn } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { FacetError } from "./errors.js";
import { logger } from "./logger.js";
import { packageName } from "./pkgspec.js";

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

const LOCKFILES: [file: string, pm: PackageManager][] = [
  ["pnpm-lock.yaml", "pnpm"],
  ["yarn.lock", "yarn"],
  ["bun.lockb", "bun"],
  ["bun.lock", "bun"],
  ["package-lock.json", "npm"],
];

async function exists(candidate: string): Promise<boolean> {
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
  }
}

/**
 * Lockfile first, `packageManager` second, npm last.
 *
 * Lockfile over the `packageManager` field on purpose: the field states intent,
 * the lockfile states what the project actually installed with, and installing
 * with the wrong one leaves two lockfiles disagreeing.
 */
export async function detectPackageManager(root: string): Promise<PackageManager> {
  for (const [file, pm] of LOCKFILES) {
    if (await exists(path.join(root, file))) {
      return pm;
    }
  }

  try {
    const raw = await readFile(path.join(root, "package.json"), "utf8");
    const declared = (JSON.parse(raw) as { packageManager?: string }).packageManager;
    if (declared !== undefined) {
      const name = declared.split("@")[0];
      if (name === "pnpm" || name === "yarn" || name === "bun" || name === "npm") {
        return name;
      }
    }
  } catch {
    // No package.json here is impossible (findProjectRoot found one), but an
    // unparseable one is just a reason to fall through.
  }

  return "npm";
}

function installArgs(pm: PackageManager, packages: string[], dev: boolean): string[] {
  switch (pm) {
    case "pnpm":
      return ["add", ...(dev ? ["-D"] : []), ...packages];
    case "yarn":
      return ["add", ...(dev ? ["-D"] : []), ...packages];
    case "bun":
      return ["add", ...(dev ? ["-d"] : []), ...packages];
    case "npm":
      return ["install", ...(dev ? ["--save-dev"] : []), ...packages];
  }
}

export async function installPackages(
  root: string,
  pm: PackageManager,
  packages: string[],
  options: { dev?: boolean } = {},
): Promise<void> {
  if (packages.length === 0) {
    return;
  }

  const args = installArgs(pm, packages, options.dev === true);

  await new Promise<void>((resolve, reject) => {
    const child = spawn(pm, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
    child.on("error", (cause) => {
      reject(new FacetError(`Could not run \`${pm}\`. Is it installed and on PATH?`, { cause }));
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new FacetError(`\`${pm} ${args.join(" ")}\` exited with ${code}.`));
    });
  });
}

/**
 * Every package the project declares, whichever section it declares it in,
 * mapped to the range as written.
 *
 * An unreadable `package.json` is reported as declaring nothing — the callers
 * treat that as "assume it is missing", which is the direction that ends in a
 * redundant install rather than a missing dependency.
 */
export async function declaredDependencies(root: string): Promise<Record<string, string>> {
  try {
    const raw = await readFile(path.join(root, "package.json"), "utf8");
    const parsed = JSON.parse(raw) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };
    return { ...parsed.dependencies, ...parsed.devDependencies, ...parsed.peerDependencies };
  } catch {
    return {};
  }
}

/**
 * Which of `packages` the project does not already depend on. Avoids an install
 * run that would only churn the lockfile.
 *
 * A declared dependency counts as present whatever version it is on, so a
 * version range here is a floor for *new* installs, not an upgrade instruction.
 * `facet doctor` is what reports an existing install sitting below a floor.
 */
export async function missingDependencies(root: string, packages: string[]): Promise<string[]> {
  const declared = await declaredDependencies(root);
  return packages.filter((spec) => declared[packageName(spec)] === undefined);
}

/**
 * Installs whatever of `packages` is missing, reporting rather than throwing on
 * failure.
 *
 * By the time this runs the caller has already written files the user wanted —
 * a registry outage or a missing private-registry token should not make those
 * look like they did not happen. The user gets the command to run instead.
 *
 * Returns whether the project ended up with everything it needs.
 */
export async function ensurePackages(
  root: string,
  packages: string[],
  options: { dev?: boolean } = {},
): Promise<boolean> {
  const missing = await missingDependencies(root, packages);
  if (missing.length === 0) {
    return true;
  }

  const pm = await detectPackageManager(root);
  logger.step(`installing ${missing.join(", ")} with ${pm}`);

  try {
    await installPackages(root, pm, missing, options);
    return true;
  } catch (error) {
    const args = installArgs(pm, missing, options.dev === true);
    logger.warn(error instanceof Error ? error.message : String(error));
    logger.warn(`Install them yourself and the rest of this still stands: ${pm} ${args.join(" ")}`);
    return false;
  }
}
