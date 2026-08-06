import { RAMPS } from "@facet-ui/theme";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../packages/tools/cli/src/core/config";
import { facetConfigSchema } from "../packages/tools/cli/src/core/configSchema";

/**
 * The schema is checked against `FacetConfig` at compile time — `PropertySchemas`
 * covers every key, so a new field does not build until it is described. What is
 * left for a test is the part types cannot see: that the file describes the
 * config this CLI actually writes, and claims the URL that config points at.
 */

const schema = facetConfigSchema() as {
  $id: string;
  additionalProperties: boolean;
  properties: Record<string, { enum?: string[]; properties?: Record<string, unknown> }>;
};

describe("facetConfigSchema", () => {
  it("claims the URL every facet.json advertises", () => {
    // A mismatch here is a file that editors fetch and then reject.
    expect(schema.$id).toBe(DEFAULT_CONFIG.$schema);
  });

  it("describes every key `facet init` writes", () => {
    for (const key of Object.keys(DEFAULT_CONFIG)) {
      expect(Object.keys(schema.properties)).toContain(key);
    }
  });

  it("offers the ramps the theme package actually has", () => {
    expect(schema.properties.theme?.properties).toBeDefined();
    const base = (schema.properties.theme as { properties: { base: { enum: string[] } } }).properties.base;
    expect(base.enum).toEqual(Object.keys(RAMPS));
    expect(base.enum).toContain(DEFAULT_CONFIG.theme.base);
  });

  it("accepts only the one style that exists", () => {
    expect(schema.properties.style?.enum).toEqual(["default"]);
  });

  it("closes the object, so a misspelled key is reported rather than ignored", () => {
    expect(schema.additionalProperties).toBe(false);
  });

  it("requires nothing, because `readConfig` fills every missing key", () => {
    expect(schema).not.toHaveProperty("required");
  });
});
