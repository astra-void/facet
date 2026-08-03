import { access } from "node:fs/promises";
import path from "node:path";
import { FacetError } from "../errors.js";

const ROOT_MARKERS = ["package.json"];

async function exists(candidate: string): Promise<boolean> {
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
  }
}

/** Walks up from `cwd` to the nearest directory holding a `package.json`. */
export async function findProjectRoot(cwd: string = process.cwd()): Promise<string> {
  let current = path.resolve(cwd);

  for (;;) {
    for (const marker of ROOT_MARKERS) {
      if (await exists(path.join(current, marker))) {
        return current;
      }
    }

    const parent = path.dirname(current);
    if (parent === current) {
      throw new FacetError(`No package.json found above ${cwd}. Run this inside a roblox-ts project.`);
    }
    current = parent;
  }
}
