/**
 * A line diff in unified format, without a dependency.
 *
 * `facet diff` compares files of a few hundred lines against text it just
 * fetched, a handful at a time. That is small enough that a plain LCS table is
 * the right algorithm and a diffing library would be a runtime dependency
 * bought for one command — the CLI has one dependency today, and it is
 * `@facet-ui/theme`.
 */

export type DiffOp = { kind: "equal" | "add" | "remove"; line: string };

export type UnifiedDiffOptions = {
  /** Unchanged lines kept around each change. */
  context?: number;
};

const DEFAULT_CONTEXT = 3;

/**
 * Longest-common-subsequence diff over lines.
 *
 * The common prefix and suffix come off first: two copies of a component
 * usually differ in one place, and trimming turns the table from the whole file
 * into the part that actually moved.
 */
export function diffLines(before: string[], after: string[]): DiffOp[] {
  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start]) {
    start += 1;
  }

  let end = 0;
  while (
    end < before.length - start &&
    end < after.length - start &&
    before[before.length - 1 - end] === after[after.length - 1 - end]
  ) {
    end += 1;
  }

  const head = before.slice(0, start).map((line): DiffOp => ({ kind: "equal", line }));
  const tail = before.slice(before.length - end).map((line): DiffOp => ({ kind: "equal", line }));
  const left = before.slice(start, before.length - end);
  const right = after.slice(start, after.length - end);

  const rows = left.length;
  const columns = right.length;
  // Suffix LCS lengths, flat: lengths[i * (columns + 1) + j] is the LCS of
  // left[i..] and right[j..]. A typed array keeps the table out of the way of
  // `noUncheckedIndexedAccess` and off the heap as boxed numbers.
  const lengths = new Int32Array((rows + 1) * (columns + 1));
  // Every index below is in range by construction; the fallback is here because
  // `noUncheckedIndexedAccess` cannot see that, not because it can happen.
  const lcs = (index: number): number => lengths[index] ?? 0;

  for (let i = rows - 1; i >= 0; i -= 1) {
    for (let j = columns - 1; j >= 0; j -= 1) {
      const here = i * (columns + 1) + j;
      lengths[here] =
        left[i] === right[j] ? lcs(here + columns + 2) + 1 : Math.max(lcs(here + columns + 1), lcs(here + 1));
    }
  }

  const middle: DiffOp[] = [];
  let i = 0;
  let j = 0;

  while (i < rows && j < columns) {
    const here = i * (columns + 1) + j;
    if (left[i] === right[j]) {
      middle.push({ kind: "equal", line: left[i] as string });
      i += 1;
      j += 1;
    } else if (lcs(here + columns + 1) >= lcs(here + 1)) {
      middle.push({ kind: "remove", line: left[i] as string });
      i += 1;
    } else {
      middle.push({ kind: "add", line: right[j] as string });
      j += 1;
    }
  }

  for (; i < rows; i += 1) {
    middle.push({ kind: "remove", line: left[i] as string });
  }
  for (; j < columns; j += 1) {
    middle.push({ kind: "add", line: right[j] as string });
  }

  return [...head, ...middle, ...tail];
}

/**
 * Renders `before` → `after` as unified-diff lines, or an empty array when the
 * two are identical. No `---`/`+++` header: the caller knows what it is
 * comparing and prints that itself.
 */
export function unifiedDiff(before: string, after: string, options: UnifiedDiffOptions = {}): string[] {
  if (before === after) {
    return [];
  }

  const context = options.context ?? DEFAULT_CONTEXT;
  const ops = diffLines(before.split("\n"), after.split("\n"));

  // Which unchanged lines are close enough to a change to be worth printing.
  const near = new Array<boolean>(ops.length).fill(false);
  for (const [at, op] of ops.entries()) {
    if (op.kind === "equal") {
      continue;
    }
    for (let offset = Math.max(0, at - context); offset <= Math.min(ops.length - 1, at + context); offset += 1) {
      near[offset] = true;
    }
  }

  const lines: string[] = [];
  let beforeLine = 1;
  let afterLine = 1;
  let at = 0;

  while (at < ops.length) {
    if (!near[at]) {
      const op = ops[at];
      if (op?.kind !== "add") {
        beforeLine += 1;
      }
      if (op?.kind !== "remove") {
        afterLine += 1;
      }
      at += 1;
      continue;
    }

    const hunkBeforeStart = beforeLine;
    const hunkAfterStart = afterLine;
    const body: string[] = [];
    let beforeCount = 0;
    let afterCount = 0;

    while (at < ops.length && near[at]) {
      const op = ops[at];
      if (op === undefined) {
        break;
      }

      if (op.kind !== "add") {
        beforeLine += 1;
        beforeCount += 1;
      }
      if (op.kind !== "remove") {
        afterLine += 1;
        afterCount += 1;
      }

      body.push(`${op.kind === "add" ? "+" : op.kind === "remove" ? "-" : " "}${op.line}`);
      at += 1;
    }

    lines.push(`@@ -${hunkBeforeStart},${beforeCount} +${hunkAfterStart},${afterCount} @@`, ...body);
  }

  return lines;
}
