/**
 * Reading npm install specs — the `name@range` strings that appear in
 * `BUILD_DEPENDENCIES` and in a registry item's `dependencies`.
 *
 * The comparison here is deliberately not a semver implementation. It answers
 * one question — "is what is installed at least the version this needs?" — for
 * the shapes Facet actually writes (`^0.9.0`, `>=0.8.0`, `0.1.1`). Anything it
 * cannot read it reports as unknown rather than guessing, because a doctor that
 * invents a failure is worse than one that admits a gap.
 */

export type PackageSpec = {
  name: string;
  /** The range as written, `undefined` when the spec is a bare name. */
  range?: string;
};

/**
 * Splits `name@range`, leaving a scoped package's leading `@` alone —
 * `@facet-ui/theme` is a name, `vela-rbxts@^0.9.0` is a name and a range, and
 * `@lattice-ui/react-runtime@^0.8.0` is both at once.
 */
export function parseSpec(spec: string): PackageSpec {
  const at = spec.lastIndexOf("@");
  return at > 0 ? { name: spec.slice(0, at), range: spec.slice(at + 1) } : { name: spec };
}

export function packageName(spec: string): string {
  return parseSpec(spec).name;
}

const VERSION = /(\d+)\.(\d+)\.(\d+)/;

/**
 * The lowest release a range admits, as a plain version.
 *
 * `^0.9.0`, `~0.9.0`, `>=0.9.0` and `0.9.0` all floor at `0.9.0`; `*`,
 * `latest`, `workspace:*` and anything else without a version in it have no
 * floor to check against and return `undefined`.
 *
 * A prerelease suffix is dropped, so `0.9.0-beta.1` counts as meeting a `0.9.0`
 * floor. That errs toward not nagging someone who deliberately installed a
 * prerelease of the very version being asked for.
 */
export function minimumVersion(range: string): string | undefined {
  const match = VERSION.exec(range);
  return match === null ? undefined : `${match[1]}.${match[2]}.${match[3]}`;
}

/** Standard version ordering. Returns <0, 0, or >0, or `undefined` if either side is unreadable. */
export function compareVersions(a: string, b: string): number | undefined {
  const left = VERSION.exec(a);
  const right = VERSION.exec(b);
  if (left === null || right === null) {
    return undefined;
  }

  for (let part = 1; part <= 3; part += 1) {
    const difference = Number(left[part]) - Number(right[part]);
    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
}

/** Whether `version` is at least `floor`. `undefined` when either is unreadable. */
export function meetsFloor(version: string, floor: string): boolean | undefined {
  const order = compareVersions(version, floor);
  return order === undefined ? undefined : order >= 0;
}
