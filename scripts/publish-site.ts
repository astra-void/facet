import { cp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { order, published, type Revisions, readRevisions } from "./lib/revisions";

/**
 * Folds a fresh build into the published site.
 *
 * Pages deploys one artifact and that artifact replaces everything, so an
 * immutable `r/<revision>/` written by one deploy would be gone by the next.
 * The published tree therefore lives on a branch and accumulates: this copies
 * the new build over it and leaves every revision already there untouched. The
 * whole accumulated tree is then what gets uploaded.
 *
 *   node --import tsx scripts/publish-site.ts --built <dir> --into <checkout> --revision <id>
 *
 * See docs/decisions/registry-versioning.md.
 */

function argument(name: string): string | undefined {
  const flag = process.argv.indexOf(`--${name}`);
  const value = flag === -1 ? undefined : process.argv[flag + 1];
  return value === undefined || value.startsWith("--") ? undefined : value;
}

async function main(): Promise<void> {
  const built = argument("built");
  const into = argument("into");
  const revision = argument("revision");

  if (built === undefined || into === undefined || revision === undefined) {
    console.error("usage: publish-site.ts --built <dir> --into <dir> --revision <id>");
    process.exitCode = 1;
    return;
  }

  const target = path.resolve(into);
  await mkdir(path.join(target, "r"), { recursive: true });

  // Copy in, never mirror: the target holds revisions this build knows nothing
  // about, and they are the point of the exercise.
  await cp(path.resolve(built), target, { recursive: true, force: true });

  const existing = await readRevisions(path.join(target, "revisions.json"));
  const found = await published(path.join(target, "r"));

  if (!found.has(revision)) {
    console.error(`✗ ${revision} is not under r/ after the copy — the build did not pin it`);
    process.exitCode = 1;
    return;
  }

  const revisions: Revisions = { latest: revision, revisions: order(existing, found) };
  await writeFile(path.join(target, "revisions.json"), `${JSON.stringify(revisions, undefined, 2)}\n`, "utf8");

  console.log(`✓ published ${revision}; ${revisions.revisions.length} revision(s) available`);
}

// Not top-level await: the workspace root is CommonJS, so tsx transforms these
// scripts to CJS where top-level await is unavailable.
main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
