# AGENTS.md

## Project overview

This repository is the Facet monorepo: copy-in UI components for roblox-ts, built on Lattice UI
(behavior) and Vela (styling).

- `packages/react/variants` — `@facet-ui/react-variants`, rbxts runtime, built by `rbxtsc`
- `packages/tools/theme` — `@facet-ui/theme`, Node, produces a Vela config preset
- `packages/tools/cli` — `facet-rbxts`, the CLI; published as `facet-rbxts`, invoked as `facet`
- `registry/` — the authored registry: manifest plus the component sources that get copied. This
  workspace type-checks them in place, `~/` aliases and all
- `apps/playground` — Roblox app that consumes a synced copy (`pnpm sync:playground`) and builds it
  through `rbxtsc` and the Vela transformer. `apps/playground/src/shared` is generated; never edit it

## The one rule that explains the rest

**Registry sources are text that gets copied into someone else's project.** They are not compiled or
published from here. Everything below follows from that:

- A registry component may only import from: `@rbxts/*`, `@lattice-ui/*`, `@facet-ui/react-variants`,
  and `~/...` paths. Anything else will not resolve once copied.
- Cross-directory imports inside the registry must use the `~/` prefix — never a relative path. The
  CLI rewrites `~/`; it cannot rewrite `../lib/utils`.
- Every import a component makes must be declared in `registry/registry.ts` as a `dependency` or a
  `registryDependency`. An undeclared import ships a file that cannot compile.
- Components are written to be edited. Prefer a readable 60-line component over a clever 20-line one.
  The consumer reads this code; it is the product.

## Layer boundaries

Do not reimplement in Facet what Lattice or Vela already owns.

- Focus, layering, presence, portals, controlled/uncontrolled state → **Lattice**. If a Facet
  component grows this logic, the fix belongs in the Lattice primitive.
- Colors, spacing, radii, fonts → **Vela classes** naming semantic tokens. Never a literal `Color3`
  or `UDim2` in a registry component, and never a ramp step (`bg-zinc-800`) — only a role
  (`bg-muted`). This is what makes retheming a config edit.
- Variant → class mapping → **`fv()`**. Not conditionals scattered through JSX.

Vela supports `hover:`, `active:`, `focus:`, and responsive variants. It has no `disabled:` — disabled
is Facet's own state, applied through `cn(disabled && "...")`.

## Working in this repo

- Use `pnpm`. Node 20+.
- `pnpm check` runs lint, typecheck, and `registry:check`.
- After editing `registry/registry.ts` or `registry/src`, run `pnpm registry:check`.
- `pnpm registry:build` regenerates `site/` — generated, git-ignored, never hand-edited. CI deploys
  it to GitHub Pages on every push to `main`, and the CLI fetches from there at runtime. A component
  reaches users by being published to the registry, not by a CLI release.
- To run the CLI against the working tree instead of the live registry:
  `FACET_REGISTRY_DIR=site/r pnpm facet list`.
- Adding a component means: source in `registry/src/ui`, entry in `registry/registry.ts`, a scene in
  `apps/playground`. All three, or it is not done.

## Roblox environment notes

- This is not a browser React app. No DOM, no CSS, no `window`/`document`.
- roblox-ts derives its node_modules root from the nearest `package.json`, so an app's dependencies
  must sit physically under that app's own `node_modules`. That is why the workspace uses
  `nodeLinker: isolated` and rbxts apps set `preserveSymlinks: true` — resolving through pnpm's
  store would land outside the app and every import would fail as `noUnscopedModule`.
- Lua tables cannot hold `nil` without leaving a hole, so roblox-ts rejects `undefined` as an array
  element type. Guard before pushing rather than typing the array as optional (see `ClassItem`).
- Roblox instance defaults are themselves a look — a bare `textbutton` is an opaque grey box labelled
  "Button". Neutralize those defaults (`BackgroundTransparency`, `BorderSizePixel`, `Text`,
  `AutoButtonColor`) before styling.
- Spread order on a host instance: neutral defaults, then consumer passthrough, then behavior props.
  Consumers override appearance, never behavior. Compose `Event` handlers rather than replacing them.
- Roblox runtime behavior cannot be verified from static reasoning. Do not claim it was.

## Scope discipline

- Do not rename packages, restructure the registry, or redesign the CLI contracts unless the task is
  explicitly about that.
- The registry schema in `packages/tools/cli/src/core/registry/schema.ts` is a published format.
  Changing it is a breaking change and needs a version bump on `RegistryIndex.version`.
