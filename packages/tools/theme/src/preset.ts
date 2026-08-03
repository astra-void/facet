import { buildColors } from "./tokens.js";
import type { FacetThemeOptions, ThemeExtend } from "./types.js";

const DEFAULT_RADIUS = "new UDim(0, 8)";

/**
 * Returns the `theme.extend` fragment Facet components expect, for spreading
 * into `vela.config.ts`:
 *
 * ```ts
 * import { defineConfig } from "vela-rbxts";
 * import { facetTheme } from "@facet-ui/theme";
 *
 * export default defineConfig({
 *   theme: {
 *     extend: {
 *       ...facetTheme({ base: "zinc", mode: "dark" }),
 *     },
 *   },
 * });
 * ```
 *
 * `extend` rather than `colors` on purpose: Vela's `theme.colors` *replaces*
 * the family set, which would strip the ramps (`zinc-500`, `red-400`, ...) that
 * consumers reach for outside Facet components.
 */
export function facetTheme(options: FacetThemeOptions = {}): ThemeExtend {
  return {
    colors: buildColors(options),
    radius: {
      DEFAULT: options.radius ?? DEFAULT_RADIUS,
    },
  };
}
