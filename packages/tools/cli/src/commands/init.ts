import { NotImplementedError } from "../core/errors.js";

export type InitOptions = {
  cwd?: string;
  /** Skip prompts and take every default. */
  yes?: boolean;
};

/**
 * `facet init` — makes a roblox-ts project ready to receive components.
 *
 * Steps, in order:
 *  1. locate the project root and refuse to run twice without `--force`
 *  2. prompt for base ramp, mode, and the three alias directories
 *  3. write `facet.json`
 *  4. patch `vela.config.ts`: import `facetTheme` and spread it into
 *     `theme.extend`, creating the file if the project has none
 *  5. ensure `vela-rbxts/transformer` is in the project's tsconfig `plugins`
 *  6. install `@facet-ui/react-variants` and `@facet-ui/theme`
 *  7. copy the `lib` items every component assumes (`utils`)
 *
 * Steps 4 and 5 are the ones that need care: both edit files the consumer owns,
 * so both are patches guarded by an already-applied check, never rewrites.
 */
export async function init(_options: InitOptions = {}): Promise<void> {
  throw new NotImplementedError("facet init");
}
