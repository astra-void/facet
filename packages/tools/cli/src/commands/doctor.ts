import { NotImplementedError } from "../core/errors.js";

export type DoctorOptions = {
  cwd?: string;
};

/**
 * `facet doctor` — checks the project is set up the way components assume.
 *
 * Checks:
 *  - `facet.json` exists and its alias directories resolve
 *  - `vela-rbxts/transformer` is registered in tsconfig `plugins`
 *  - `vela.config.ts` defines every semantic token installed components name
 *  - `@rbxts/react` and the Lattice packages components import are installed,
 *    at versions the current registry was built against
 *
 * The third is the valuable one: a missing token surfaces today as a Vela
 * diagnostic pointing at a component the consumer never wrote.
 */
export async function doctor(_options: DoctorOptions = {}): Promise<void> {
  throw new NotImplementedError("facet doctor");
}
