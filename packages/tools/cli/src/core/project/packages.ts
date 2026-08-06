import { readFile } from "node:fs/promises";
import path from "node:path";
import { meetsFloor, minimumVersion, parseSpec } from "../pkgspec.js";
import { declaredDependencies } from "../pm.js";

export type PackageStatus =
  /** Neither declared nor installed. */
  | "missing"
  /** Present, but older than the spec asks for. */
  | "below-floor"
  /** Present, and either the spec or the version is not a shape this can compare. */
  | "unverifiable"
  | "ok";

export type PackageReport = {
  name: string;
  /** The lowest version the spec admits, when the spec named one. */
  floor?: string;
  /** The range in the project's `package.json`. */
  declared?: string;
  /** The version actually sitting in `node_modules`. */
  installed?: string;
  status: PackageStatus;
  /** What asked for it — registry item names, or whatever the caller labels the toolchain. */
  neededBy: string[];
};

/**
 * The version of `name` actually installed, by reading its own `package.json`.
 *
 * Walks up from the project root because a project inside a workspace has its
 * dependencies hoisted above it. This is the installed truth rather than the
 * declared range, and the two differ exactly when someone installed once and
 * never again — which is the case worth catching.
 */
export async function installedVersion(root: string, name: string): Promise<string | undefined> {
  let current = path.resolve(root);

  for (;;) {
    try {
      const raw = await readFile(path.join(current, "node_modules", name, "package.json"), "utf8");
      const version = (JSON.parse(raw) as { version?: string }).version;
      if (typeof version === "string") {
        return version;
      }
    } catch {
      // Not here; try the parent.
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return undefined;
    }
    current = parent;
  }
}

function statusOf(
  floor: string | undefined,
  installed: string | undefined,
  declared: string | undefined,
): PackageStatus {
  if (installed === undefined && declared === undefined) {
    return "missing";
  }

  if (floor === undefined) {
    return "ok";
  }

  // The installed version is the truth; the declared range is the fallback for
  // a project whose dependencies are not installed yet, where the most that can
  // be said is whether the range would ever allow the floor.
  const against = installed ?? (declared === undefined ? undefined : minimumVersion(declared));
  if (against === undefined) {
    return "unverifiable";
  }

  const meets = meetsFloor(against, floor);
  if (meets === undefined) {
    return "unverifiable";
  }

  return meets ? "ok" : "below-floor";
}

/**
 * Checks a set of `name@range` specs against what the project declares and what
 * it has installed.
 *
 * `needs` maps a spec to the things that asked for it, so a report can say
 * which component a missing package belongs to rather than just naming it.
 */
export async function inspectPackages(root: string, needs: Map<string, string[]>): Promise<PackageReport[]> {
  const declared = await declaredDependencies(root);

  const reports: PackageReport[] = [];
  for (const [spec, neededBy] of needs) {
    const { name, range } = parseSpec(spec);
    const floor = range === undefined ? undefined : minimumVersion(range);
    const installed = await installedVersion(root, name);

    reports.push({
      name,
      floor,
      declared: declared[name],
      installed,
      status: statusOf(floor, installed, declared[name]),
      neededBy,
    });
  }

  return reports.sort((a, b) => a.name.localeCompare(b.name));
}
