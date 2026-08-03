import type { ColorExpression, FacetBase } from "./types.js";

export type Ramp = Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950, ColorExpression>;

const rgb = (r: number, g: number, b: number): ColorExpression => `Color3.fromRGB(${r}, ${g}, ${b})`;

export const WHITE = rgb(255, 255, 255);

export const RAMPS: Record<FacetBase, Ramp> = {
  zinc: {
    50: rgb(250, 250, 250),
    100: rgb(244, 244, 245),
    200: rgb(228, 228, 231),
    300: rgb(212, 212, 216),
    400: rgb(161, 161, 170),
    500: rgb(113, 113, 122),
    600: rgb(82, 82, 91),
    700: rgb(63, 63, 70),
    800: rgb(39, 39, 42),
    900: rgb(24, 24, 27),
    950: rgb(9, 9, 11),
  },
  slate: {
    50: rgb(248, 250, 252),
    100: rgb(241, 245, 249),
    200: rgb(226, 232, 240),
    300: rgb(203, 213, 225),
    400: rgb(148, 163, 184),
    500: rgb(100, 116, 139),
    600: rgb(71, 85, 105),
    700: rgb(51, 65, 85),
    800: rgb(30, 41, 59),
    900: rgb(15, 23, 42),
    950: rgb(2, 6, 23),
  },
  stone: {
    50: rgb(250, 250, 249),
    100: rgb(245, 245, 244),
    200: rgb(231, 229, 228),
    300: rgb(214, 211, 209),
    400: rgb(168, 162, 158),
    500: rgb(120, 113, 108),
    600: rgb(87, 83, 78),
    700: rgb(68, 64, 60),
    800: rgb(41, 37, 36),
    900: rgb(28, 25, 23),
    950: rgb(12, 10, 9),
  },
  neutral: {
    50: rgb(250, 250, 250),
    100: rgb(245, 245, 245),
    200: rgb(229, 229, 229),
    300: rgb(212, 212, 212),
    400: rgb(163, 163, 163),
    500: rgb(115, 115, 115),
    600: rgb(82, 82, 82),
    700: rgb(64, 64, 64),
    800: rgb(38, 38, 38),
    900: rgb(23, 23, 23),
    950: rgb(10, 10, 10),
  },
};

export const DESTRUCTIVE = {
  light: rgb(239, 68, 68),
  dark: rgb(220, 38, 38),
} as const;
