/**
 * What a project needs installed before a copied component compiles.
 *
 * Shared by `init`, which installs these, and `doctor`, which checks them. The
 * two drifting apart is exactly how a project ends up below a floor without
 * anything telling it so.
 */

/**
 * Needed to build the project, not to run it — only `vela.config.ts` imports
 * these.
 *
 * Vela carries a floor rather than being left open. Registry components lean on
 * families Vela only resolves on the computed-className path — `w-fit` and
 * `font-<weight>` from 0.7.0, `opacity-*`, `whitespace-*` and `leading-*` from
 * 0.8.0 — and below the floor those compile and then quietly do nothing.
 *
 * 0.9.0 is a harder floor than that: below it `card` does not compile at all.
 * Vela 0.8.0 inlined its runtime into every emitted file, spending ~96 of
 * Luau's 200 local registers before the file declared anything of its own, so
 * `card` failed at its second part with `Out of local registers` pointing at
 * generated code the author never wrote.
 *
 * The caret is npm's 0.x caret: `^0.9.0` means `>=0.9.0 <0.10.0`, so this is a
 * floor for a fresh `init` and a ceiling on the next Vela minor. That is the
 * intended reading while Vela is pre-1.0 and every minor so far has moved class
 * resolution. Raising it is a CLI release, which is the point at which the
 * registry has actually been built against the new minor.
 */
export const BUILD_DEPENDENCIES = ["@facet-ui/theme", "vela-rbxts@^0.9.0"];
