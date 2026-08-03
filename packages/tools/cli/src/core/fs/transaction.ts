import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

type PlannedWrite = {
  absolutePath: string;
  content: string;
};

type Undo = { absolutePath: string; previous: string | undefined };

/**
 * Writes a set of files as one unit.
 *
 * `facet add dialog` touches several files, and half a component is worse than
 * none of it: the project neither compiles nor is obviously broken. On any
 * failure this restores what it overwrote and deletes what it created.
 *
 * It does not defend against a concurrent process editing the same files; the
 * failure it exists for is a write partway through the set, not a race.
 */
export class FileTransaction {
  private readonly writes: PlannedWrite[] = [];

  constructor(private readonly root: string) {}

  /** `relativePath` is project-relative; content is written verbatim. */
  add(relativePath: string, content: string): void {
    this.writes.push({ absolutePath: path.resolve(this.root, relativePath), content });
  }

  get size(): number {
    return this.writes.length;
  }

  async commit(): Promise<void> {
    const undo: Undo[] = [];

    try {
      for (const write of this.writes) {
        let previous: string | undefined;
        try {
          previous = await readFile(write.absolutePath, "utf8");
        } catch {
          previous = undefined;
        }
        undo.push({ absolutePath: write.absolutePath, previous });

        await mkdir(path.dirname(write.absolutePath), { recursive: true });
        await writeFile(write.absolutePath, write.content, "utf8");
      }
    } catch (error) {
      await this.rollback(undo);
      throw error;
    }
  }

  private async rollback(undo: Undo[]): Promise<void> {
    // Reverse order so a file created inside a directory goes before anything
    // that may have created that directory.
    for (const entry of undo.reverse()) {
      try {
        if (entry.previous === undefined) {
          await rm(entry.absolutePath, { force: true });
        } else {
          await writeFile(entry.absolutePath, entry.previous, "utf8");
        }
      } catch {
        // A failed rollback must not mask the error that caused it.
      }
    }
  }
}
