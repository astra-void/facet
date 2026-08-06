import type { FacetBase, FacetMode } from "@facet-ui/theme";
import { DEFAULT_CONFIG, type FacetConfig } from "./config.js";

/**
 * The JSON Schema `facet.json` advertises in its own `$schema` field.
 *
 * Emitted to the site root by `scripts/build-registry.ts`, so it is published
 * by the same deploy as the registry and can never be a version behind it.
 *
 * It lives next to `FacetConfig` rather than as a checked-in JSON file because
 * the two have to agree: `properties` below is typed as covering every key of
 * the config, so adding a field to `FacetConfig` without describing it here
 * does not compile.
 */

/** One entry per key of `FacetConfig`. Required, so a new field cannot be forgotten. */
type PropertySchemas = { [K in keyof Required<FacetConfig>]: Record<string, unknown> };

/**
 * The enums, listed as maps over their unions so the compiler insists on every
 * member. A new ramp in `@facet-ui/theme` does not build until it appears here.
 *
 * Listed rather than read off `RAMPS` at runtime on purpose: the site build
 * imports this module through `tsx`, and a value import from `@facet-ui/theme`
 * would make `registry:check` depend on that package having been compiled
 * first. Type imports erase; this keeps the registry deploy free of the build.
 */
const BASES: Record<FacetBase, null> = { zinc: null, slate: null, stone: null, neutral: null };
const MODES: Record<FacetMode, null> = { light: null, dark: null };

const aliasSchema = (what: string) => ({
  type: "object",
  description: `Where ${what} land, and how other copied files import them.`,
  additionalProperties: false,
  properties: {
    dir: {
      type: "string",
      description: "Directory from the project root. A real path: roblox-ts projects are laid out by Rojo.",
    },
    import: {
      type: "string",
      description:
        "Specifier other copied files use to reach this directory, e.g. `shared/ui`. " +
        "Omit for relative imports, which need no tsconfig `paths` and so work anywhere.",
    },
  },
});

const properties: PropertySchemas = {
  $schema: {
    type: "string",
    description: "This schema.",
  },
  style: {
    // There is one style and there will not be a second — see
    // docs/decisions/registry-styles.md. The field stays because facet.json is
    // a file consumers commit, and a fork may serve something else under it.
    enum: ["default"],
    description: "Registry style variant. Only `default` exists.",
  },
  theme: {
    type: "object",
    additionalProperties: false,
    properties: {
      base: {
        enum: Object.keys(BASES),
        description: "Neutral ramp the semantic tokens are drawn from.",
      },
      mode: {
        enum: Object.keys(MODES),
        description: "Which side of the ramp tokens resolve to. Vela resolves at compile time, so a build has one.",
      },
    },
  },
  aliases: {
    type: "object",
    additionalProperties: false,
    properties: {
      ui: aliasSchema("components"),
      lib: aliasSchema("helpers"),
      hooks: aliasSchema("hooks"),
    },
  },
  velaConfig: {
    type: "string",
    description: "Path to the project's Vela config, relative to the project root.",
  },
  registry: {
    type: "string",
    description: "Registry to read components from. Omit for the published one; set it to pin a fork or a version.",
  },
};

/**
 * Nothing is `required`: `readConfig` fills every missing key from the
 * defaults, so a hand-edited file that leaves one out still works, and a schema
 * that flagged it would be reporting a problem the CLI does not have.
 */
export function facetConfigSchema(): Record<string, unknown> {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: DEFAULT_CONFIG.$schema,
    title: "Facet configuration",
    description: "facet.json — what `facet add` copies, where it lands, and which theme it is written against.",
    type: "object",
    additionalProperties: false,
    properties,
  };
}
