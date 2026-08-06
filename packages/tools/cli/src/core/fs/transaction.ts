import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

type PlannedChange =
  | { kind: "write"; absolutePath: string; content: string }
  | { kind: "delete"; absolutePath: string };

type Undo = { absolutePath: string; previous: string | undefined };

/**
 * Applies a set of file changes as one unit.
 *
 * `facet add dialog` touches several files, and half a component is worse than
 * none of it: the project neither compiles nor is obviously broken. `facet
 * remove` has the same problem in reverse. On any failure this restores what it
 * overwrote or deleted, and removes what it created.
 *
 * It does not defend against a concurrent process editing the same files; the
 * failure it exists for is a change partway through the set, not a race.
 */
export class FileTransaction {
  private readonly changes: PlannedChange[] = [];

  constructor(private readonly root: string) {}

  /** `relativePath` is project-relative; content is written verbatim. */
  add(relativePath: string, content: string): void {
    this.changes.push({ kind: "write", absolutePath: path.resolve(this.root, relativePath), content });
  }

  /** Deletes a project-relative file, restoring it if a later change fails. */
  delete(relativePath: string): void {
    this.changes.push({ kind: "delete", absolutePath: path.resolve(this.root, relativePath) });
  }

  get size(): number {
    return this.changes.length;
  }

  async commit(): Promise<void> {
    const undo: Undo[] = [];

    try {
      for (const change of this.changes) {
        let previous: string | undefined;
        try {
          previous = await readFile(change.absolutePath, "utf8");
        } catch {
          previous = undefined;
        }
        undo.push({ absolutePath: change.absolutePath, previous });

        if (change.kind === "write") {
          await mkdir(path.dirname(change.absolutePath), { recursive: true });
          await writeFile(change.absolutePath, change.content, "utf8");
        } else {
          await rm(change.absolutePath, { force: true });
        }
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
          await mkdir(path.dirname(entry.absolutePath), { recursive: true });
          await writeFile(entry.absolutePath, entry.previous, "utf8");
        }
      } catch {
        // A failed rollback must not mask the error that caused it.
      }
    }
  }
}
