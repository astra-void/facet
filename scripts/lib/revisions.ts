import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

/**
 * The published revision list — what `r/<id>/` directories exist and which one
 * `r/` currently mirrors.
 *
 * Kept apart from `publish-site.ts` because that script runs on import: this is
 * the part worth testing, and importing it must not publish anything.
 */

export type Revision = {
  revision: string;
  /** Version of the CLI that built it, straight from that revision's index. */
  generatedBy: string;
  components: number;
};

export type Revisions = {
  /** The revision `r/` currently serves. Pinning this is pinning today's registry. */
  latest: string;
  /** Newest first. Order is preserved from the previous file; new ones go on top. */
  revisions: Revision[];
};

async function readJson<T>(file: string): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch {
    return undefined;
  }
}

/** Every revision directory actually present under `r/`, as the source of truth. */
export async function published(registryDir: string): Promise<Map<string, Revision>> {
  const found = new Map<string, Revision>();

  let entries: Awaited<ReturnType<typeof readdir>>;
  try {
    entries = await readdir(registryDir, { withFileTypes: true });
  } catch {
    return found;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const index = await readJson<{ generatedBy?: string; items?: unknown[] }>(
      path.join(registryDir, entry.name, "index.json"),
    );
    if (index === undefined) {
      // A directory under `r/` with no index is not a revision. Leave it alone
      // rather than listing something the CLI could not read.
      continue;
    }

    found.set(entry.name, {
      revision: entry.name,
      generatedBy: index.generatedBy ?? "unknown",
      components: index.items?.length ?? 0,
    });
  }

  return found;
}

/**
 * Rebuilt from what is on disk each time rather than appended to, so a revision
 * that was never published — or one deleted by hand — cannot linger in the
 * list. The previous file supplies order and nothing else.
 */
export function order(existing: Revisions | undefined, found: Map<string, Revision>): Revision[] {
  const known = existing?.revisions.map((entry) => entry.revision) ?? [];
  const listed = new Set(known);

  const fresh = [...found.keys()].filter((revision) => !listed.has(revision)).sort();
  const kept = known.filter((revision) => found.has(revision));

  return [...fresh, ...kept].flatMap((revision) => {
    const entry = found.get(revision);
    return entry === undefined ? [] : [entry];
  });
}

export async function readRevisions(file: string): Promise<Revisions | undefined> {
  return readJson<Revisions>(file);
}
