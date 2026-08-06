import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export type Fixture = {
  /** Absolute path to the project root, with symlinks resolved. */
  root: string;
  write(relative: string, content: string): Promise<void>;
  read(relative: string): Promise<string>;
  /**
   * Puts a package in `node_modules` at a version, without installing anything.
   * `doctor` reads the version out of the package's own `package.json`, which is
   * all a test needs to stand in for an install.
   */
  install(name: string, version: string): Promise<void>;
  cleanup(): Promise<void>;
};

/**
 * A throwaway project directory to run the CLI against.
 *
 * The root is realpath'd because macOS hands out `/var/folders/...` temporary
 * directories that are really `/private/var/...`, and `findProjectRoot` returns
 * the resolved form — comparing the two otherwise fails for no reason a reader
 * would guess.
 */
export async function createProject(files: Record<string, string> = {}): Promise<Fixture> {
  const root = await realpath(await mkdtemp(path.join(tmpdir(), "facet-test-")));

  const fixture: Fixture = {
    root,
    async write(relative, content) {
      const file = path.join(root, relative);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, content, "utf8");
    },
    async read(relative) {
      return readFile(path.join(root, relative), "utf8");
    },
    async install(name, version) {
      await fixture.write(path.join("node_modules", name, "package.json"), JSON.stringify({ name, version }));
    },
    async cleanup() {
      await rm(root, { recursive: true, force: true });
    },
  };

  await fixture.write("package.json", JSON.stringify({ name: "fixture", private: true }, undefined, 2));
  for (const [relative, content] of Object.entries(files)) {
    await fixture.write(relative, content);
  }

  return fixture;
}

/** A tsconfig with the Vela transformer registered, written as the JSONC these projects really use. */
export const TSCONFIG_WITH_TRANSFORMER = `{
  // roblox-ts projects are routinely JSONC.
  "compilerOptions": {
    "plugins": [{ "transform": "vela-rbxts/transformer" }]
  }
}
`;
