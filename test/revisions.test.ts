import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { order, published, type Revisions } from "../scripts/lib/revisions";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const run = promisify(execFile);

let scratch: string | undefined;

async function temporary(): Promise<string> {
  scratch = await realpath(await mkdtemp(path.join(tmpdir(), "facet-revisions-")));
  return scratch;
}

afterEach(async () => {
  if (scratch !== undefined) {
    await rm(scratch, { recursive: true, force: true });
    scratch = undefined;
  }
});

/** A revision directory as the build writes one: a directory with an index in it. */
async function writeRevision(registryDir: string, revision: string, items: number): Promise<void> {
  await mkdir(path.join(registryDir, revision), { recursive: true });
  await writeFile(
    path.join(registryDir, revision, "index.json"),
    JSON.stringify({ version: 1, generatedBy: "0.3.0", items: new Array(items).fill({}) }),
    "utf8",
  );
}

describe("published", () => {
  it("reads every revision directory under r/", async () => {
    const registry = path.join(await temporary(), "r");
    await writeRevision(registry, "aaa1111", 10);
    await writeRevision(registry, "bbb2222", 11);

    const found = await published(registry);
    expect([...found.keys()].sort()).toEqual(["aaa1111", "bbb2222"]);
    expect(found.get("bbb2222")).toEqual({ revision: "bbb2222", generatedBy: "0.3.0", components: 11 });
  });

  it("ignores the loose payloads `r/` itself is made of", async () => {
    const registry = path.join(await temporary(), "r");
    await writeRevision(registry, "aaa1111", 10);
    await writeFile(path.join(registry, "index.json"), "{}", "utf8");
    await writeFile(path.join(registry, "button.json"), "{}", "utf8");

    expect([...(await published(registry)).keys()]).toEqual(["aaa1111"]);
  });

  it("does not list a directory with no index as a revision", async () => {
    const registry = path.join(await temporary(), "r");
    await mkdir(path.join(registry, "not-a-revision"), { recursive: true });

    expect([...(await published(registry)).keys()]).toEqual([]);
  });

  it("is empty rather than throwing when nothing has been published", async () => {
    expect([...(await published(path.join(await temporary(), "r"))).keys()]).toEqual([]);
  });
});

describe("order", () => {
  const found = new Map([
    ["aaa1111", { revision: "aaa1111", generatedBy: "0.3.0", components: 10 }],
    ["bbb2222", { revision: "bbb2222", generatedBy: "0.3.0", components: 11 }],
  ]);

  it("puts a revision nobody has listed yet on top", () => {
    const existing: Revisions = {
      latest: "aaa1111",
      revisions: [{ revision: "aaa1111", generatedBy: "0.3.0", components: 10 }],
    };

    expect(order(existing, found).map((entry) => entry.revision)).toEqual(["bbb2222", "aaa1111"]);
  });

  it("keeps the order the previous file had", () => {
    const existing: Revisions = {
      latest: "bbb2222",
      revisions: [
        { revision: "bbb2222", generatedBy: "0.3.0", components: 11 },
        { revision: "aaa1111", generatedBy: "0.3.0", components: 10 },
      ],
    };

    expect(order(existing, found).map((entry) => entry.revision)).toEqual(["bbb2222", "aaa1111"]);
  });

  it("drops a revision that is no longer on disk", () => {
    const existing: Revisions = {
      latest: "ccc3333",
      revisions: [
        { revision: "ccc3333", generatedBy: "0.3.0", components: 9 },
        { revision: "aaa1111", generatedBy: "0.3.0", components: 10 },
      ],
    };

    // Rebuilt from the filesystem every time, so a revision that was never
    // published — or was deleted by hand — cannot linger in the list.
    expect(order(existing, found).map((entry) => entry.revision)).toEqual(["bbb2222", "aaa1111"]);
  });

  it("takes what it reads off disk over what the file claimed", () => {
    const existing: Revisions = {
      latest: "bbb2222",
      revisions: [{ revision: "bbb2222", generatedBy: "0.0.1", components: 1 }],
    };

    const listed = order(existing, found).find((entry) => entry.revision === "bbb2222");
    expect(listed).toEqual({ revision: "bbb2222", generatedBy: "0.3.0", components: 11 });
  });

  it("works from nothing, which is the first publish", () => {
    expect(order(undefined, found).map((entry) => entry.revision)).toEqual(["aaa1111", "bbb2222"]);
  });
});

describe("building a revision", () => {
  it("pins a copy that is identical to the registry it was built from", async () => {
    const site = await temporary();
    await run("node", ["--import", "tsx", "scripts/build-registry.ts", "--out", site, "--revision", "abc1234"], {
      cwd: ROOT,
    });

    const registry = path.join(site, "r");
    const loose = (await readdir(registry, { withFileTypes: true }))
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name);

    expect(loose).toContain("index.json");
    for (const name of loose) {
      // Byte for byte: a pinned revision is the registry as it stood, not a
      // rendering of it. Anything else and `add` from a pin would differ from
      // `add` at the time it was pinned.
      expect(await readFile(path.join(registry, "abc1234", name), "utf8")).toBe(
        await readFile(path.join(registry, name), "utf8"),
      );
    }
  }, 60_000);

  it("writes no revision when the build is not given one", async () => {
    const site = await temporary();
    await run("node", ["--import", "tsx", "scripts/build-registry.ts", "--out", site], { cwd: ROOT });

    const directories = (await readdir(path.join(site, "r"), { withFileTypes: true })).filter((entry) =>
      entry.isDirectory(),
    );
    expect(directories).toEqual([]);
  }, 60_000);
});
