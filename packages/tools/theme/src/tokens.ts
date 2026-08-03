import { DESTRUCTIVE, RAMPS, WHITE } from "./palettes.js";
import type { ColorInputMap, FacetMode, FacetThemeOptions } from "./types.js";

/**
 * The semantic token set every Facet component is written against. A component
 * never names a ramp step (`zinc-800`) — only a role (`bg-muted`), so retheming
 * is a config edit rather than a component edit.
 */
export const FACET_TOKENS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "border",
  "input",
  "ring",
] as const;

export type FacetToken = (typeof FACET_TOKENS)[number];

export function buildTokens(options: FacetThemeOptions = {}): Record<FacetToken, string> {
  const ramp = RAMPS[options.base ?? "zinc"];
  const mode: FacetMode = options.mode ?? "dark";

  if (mode === "light") {
    return {
      background: WHITE,
      foreground: ramp[950],
      card: WHITE,
      "card-foreground": ramp[950],
      popover: WHITE,
      "popover-foreground": ramp[950],
      primary: ramp[900],
      "primary-foreground": ramp[50],
      secondary: ramp[100],
      "secondary-foreground": ramp[900],
      muted: ramp[100],
      "muted-foreground": ramp[500],
      accent: ramp[100],
      "accent-foreground": ramp[900],
      destructive: DESTRUCTIVE.light,
      "destructive-foreground": ramp[50],
      border: ramp[200],
      input: ramp[200],
      ring: ramp[950],
    };
  }

  return {
    background: ramp[950],
    foreground: ramp[50],
    card: ramp[900],
    "card-foreground": ramp[50],
    popover: ramp[900],
    "popover-foreground": ramp[50],
    primary: ramp[50],
    "primary-foreground": ramp[900],
    secondary: ramp[800],
    "secondary-foreground": ramp[50],
    muted: ramp[800],
    "muted-foreground": ramp[400],
    accent: ramp[800],
    "accent-foreground": ramp[50],
    destructive: DESTRUCTIVE.dark,
    "destructive-foreground": ramp[50],
    border: ramp[800],
    input: ramp[800],
    ring: ramp[300],
  };
}

export function buildColors(options: FacetThemeOptions = {}): ColorInputMap {
  return buildTokens(options) satisfies Record<string, string>;
}
