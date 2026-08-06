import { describe, expect, it } from "vitest";
import { diffLines, unifiedDiff } from "../packages/tools/cli/src/core/unifiedDiff";

describe("diffLines", () => {
  it("says nothing changed when nothing changed", () => {
    expect(diffLines(["a", "b"], ["a", "b"])).toEqual([
      { kind: "equal", line: "a" },
      { kind: "equal", line: "b" },
    ]);
  });

  it("keeps the common lines rather than replacing the file wholesale", () => {
    expect(diffLines(["a", "b", "c"], ["a", "x", "c"])).toEqual([
      { kind: "equal", line: "a" },
      { kind: "remove", line: "b" },
      { kind: "add", line: "x" },
      { kind: "equal", line: "c" },
    ]);
  });

  it("handles one side being empty", () => {
    expect(diffLines([], ["a"])).toEqual([{ kind: "add", line: "a" }]);
    expect(diffLines(["a"], [])).toEqual([{ kind: "remove", line: "a" }]);
  });

  it("finds a line that moved rather than calling everything new", () => {
    const ops = diffLines(["a", "b", "c", "d"], ["a", "c", "d"]);
    expect(ops.filter((op) => op.kind !== "equal")).toEqual([{ kind: "remove", line: "b" }]);
  });
});

describe("unifiedDiff", () => {
  it("is empty for identical text", () => {
    expect(unifiedDiff("a\nb\n", "a\nb\n")).toEqual([]);
  });

  it("writes a hunk header with the line counts on both sides", () => {
    expect(unifiedDiff("one", "two")).toEqual(["@@ -1,1 +1,1 @@", "-one", "+two"]);
  });

  it("keeps context around a change", () => {
    expect(unifiedDiff("a\nb", "a\nb\nc")).toEqual(["@@ -1,2 +1,3 @@", " a", " b", "+c"]);
  });

  it("splits changes that are far apart into separate hunks", () => {
    const before = Array.from({ length: 20 }, (_, at) => `l${at + 1}`);
    const after = before.map((line) => (line === "l2" ? "L2" : line === "l18" ? "L18" : line));

    expect(unifiedDiff(before.join("\n"), after.join("\n"))).toEqual([
      "@@ -1,5 +1,5 @@",
      " l1",
      "-l2",
      "+L2",
      " l3",
      " l4",
      " l5",
      "@@ -15,6 +15,6 @@",
      " l15",
      " l16",
      " l17",
      "-l18",
      "+L18",
      " l19",
      " l20",
    ]);
  });

  it("takes the context width as an option", () => {
    expect(unifiedDiff("a\nb\nc\nd\ne", "a\nb\nX\nd\ne", { context: 1 })).toEqual([
      "@@ -2,3 +2,3 @@",
      " b",
      "-c",
      "+X",
      " d",
    ]);
  });
});
