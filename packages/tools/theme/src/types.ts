/**
 * Structural mirror of the slice of Vela's config surface Facet writes into.
 * Kept local so `@facet-ui/theme` type-checks without resolving `vela-rbxts`;
 * the shapes are checked against Vela in the CLI's `doctor` command.
 */
export type ColorExpression = string;

export type ColorPalette = Record<string, ColorExpression>;

export type ColorInputMap = Record<string, ColorExpression | ColorPalette>;

export type ThemeScale = Record<string, string>;

export type ThemeExtend = {
  colors?: ColorInputMap;
  radius?: ThemeScale;
  spacing?: ThemeScale;
  fontFamily?: ThemeScale;
};

/** Neutral ramps Facet can derive its semantic tokens from. */
export type FacetBase = "zinc" | "slate" | "stone" | "neutral";

export type FacetMode = "light" | "dark";

export type FacetThemeOptions = {
  /** Neutral ramp the semantic tokens are drawn from. Defaults to `zinc`. */
  base?: FacetBase;
  /**
   * Which side of the ramp the tokens resolve to. Vela resolves classes at
   * compile time, so a build carries exactly one mode.
   */
  mode?: FacetMode;
  /** Corner radius `rounded-*` DEFAULT resolves to. Defaults to `new UDim(0, 8)`. */
  radius?: string;
};
