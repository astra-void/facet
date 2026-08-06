import { describe, expect, it } from "vitest";
import {
  compareVersions,
  meetsFloor,
  minimumVersion,
  packageName,
  parseSpec,
} from "../packages/tools/cli/src/core/pkgspec";

describe("parseSpec", () => {
  it("keeps a scoped package's leading @ out of the split", () => {
    expect(parseSpec("@facet-ui/theme")).toEqual({ name: "@facet-ui/theme" });
    expect(parseSpec("@lattice-ui/react-runtime@^0.8.0")).toEqual({
      name: "@lattice-ui/react-runtime",
      range: "^0.8.0",
    });
  });

  it("splits an unscoped spec", () => {
    expect(parseSpec("vela-rbxts")).toEqual({ name: "vela-rbxts" });
    expect(parseSpec("vela-rbxts@^0.9.0")).toEqual({ name: "vela-rbxts", range: "^0.9.0" });
  });

  it("names a package the same way whichever form it arrives in", () => {
    expect(packageName("vela-rbxts@^0.9.0")).toBe("vela-rbxts");
    expect(packageName("@facet-ui/react-variants@^0.1.1")).toBe("@facet-ui/react-variants");
  });
});

describe("minimumVersion", () => {
  it("floors the range shapes Facet writes", () => {
    expect(minimumVersion("^0.9.0")).toBe("0.9.0");
    expect(minimumVersion("~0.9.0")).toBe("0.9.0");
    expect(minimumVersion(">=0.9.0")).toBe("0.9.0");
    expect(minimumVersion("0.9.0")).toBe("0.9.0");
    expect(minimumVersion(">=0.9.0 <0.11.0")).toBe("0.9.0");
  });

  it("has nothing to compare against for a range with no version in it", () => {
    expect(minimumVersion("*")).toBeUndefined();
    expect(minimumVersion("latest")).toBeUndefined();
    expect(minimumVersion("workspace:*")).toBeUndefined();
  });
});

describe("compareVersions", () => {
  it("orders by major, then minor, then patch", () => {
    expect(compareVersions("1.0.0", "0.9.9")).toBeGreaterThan(0);
    expect(compareVersions("0.10.0", "0.9.0")).toBeGreaterThan(0);
    expect(compareVersions("0.9.1", "0.9.2")).toBeLessThan(0);
    expect(compareVersions("0.9.0", "0.9.0")).toBe(0);
  });

  it("gives up rather than guessing at something it cannot read", () => {
    expect(compareVersions("next", "0.9.0")).toBeUndefined();
  });
});

describe("meetsFloor", () => {
  it("is the check that would have caught the 0.7 floor", () => {
    expect(meetsFloor("0.7.4", "0.9.0")).toBe(false);
    expect(meetsFloor("0.9.0", "0.9.0")).toBe(true);
    expect(meetsFloor("0.9.1", "0.9.0")).toBe(true);
    expect(meetsFloor("0.10.0", "0.9.0")).toBe(true);
  });

  it("reads a prerelease of the floor as meeting it", () => {
    expect(meetsFloor("0.9.0-beta.1", "0.9.0")).toBe(true);
  });

  it("reports the unreadable as unknown, not as a failure", () => {
    expect(meetsFloor("nightly", "0.9.0")).toBeUndefined();
  });
});
