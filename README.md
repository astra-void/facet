# Facet

Copy-in UI components for [roblox-ts](https://roblox-ts.com/), built on
[Lattice UI](https://github.com/astra-void/lattice-ui) and [Vela](https://github.com/astra-void/vela-rbxts).

Facet is not a component library. You do not install a `Button` — you run one command and a
`button.tsx` appears in your project, imports resolved and theme wired up. It is yours from that
moment: edit it, delete half of it, rename it. There is no upgrade that will overwrite your changes,
because there is no upgrade.

```bash
npx facet-rbxts init
npx facet-rbxts add button dialog toast
```

## The three layers

| Layer | Owns | Package |
| --- | --- | --- |
| **Lattice UI** | behavior — focus, layering, presence, controlled state | `@lattice-ui/react-*` |
| **Vela** | styling — `className` lowered to Roblox props at compile time | `vela-rbxts` |
| **Facet** | the opinionated composition of the two, as source you own | this repo |

A Facet component is a Lattice primitive wearing Vela classes. Nothing more. That is why it can be
handed to you as a file rather than a dependency — the hard parts already live in packages that *are*
dependencies.

## What Facet actually publishes

Two small packages and a CLI. The components are not published; they are copied.

| Package | What it does |
| --- | --- |
| `@facet-ui/react-variants` | `fv()` variant recipes and `cn()` — the cva equivalent. The only runtime code a Facet component imports from Facet. |
| `@facet-ui/theme` | Semantic tokens (`primary`, `muted-foreground`, …) as a Vela config preset. Facet's answer to `:root { --primary }`. |
| `facet-rbxts` | The CLI. Fetches components from the hosted registry rather than bundling them. |

## Repository layout

```
packages/
  react/variants/     @facet-ui/react-variants  — rbxts runtime, built by rbxtsc
  tools/theme/        @facet-ui/theme           — node, feeds vela.config.ts
  tools/cli/          facet-rbxts               — node, the CLI
registry/
  registry.ts         the authored manifest — what exists, what it depends on
  src/ui/*.tsx        the component sources `facet add` copies
  src/lib/*.ts        shared helpers those components import
apps/
  playground/         Roblox app that consumes a synced copy, like any project
scripts/
  build-registry.ts   registry/ → site/, the static registry served to the CLI
  sync-playground.ts  registry/ → apps/playground/src/shared, doing what `add` will
site/                 generated, never committed; deployed to GitHub Pages by CI
```

`registry/src` is compiled by nothing at publish time — it is text that gets copied. It is checked
in two places, and both matter:

- the `registry` workspace type-checks the sources in place, `~/` aliases and all
- `apps/playground` type-checks and *builds* them after a sync that copies and rewrites exactly as
  `facet add` will, so a rewriting bug surfaces here rather than in someone's project

The playground is a consumer, not a second home for the sources.

## The registry is hosted, not bundled

`registry/` builds to a static site on GitHub Pages, and the CLI fetches from it. Adding a component
means publishing the registry, not releasing the CLI — see
[docs/decisions/registry-hosting.md](docs/decisions/registry-hosting.md).

```bash
facet add button --registry https://example.com/r   # a fork or private registry
FACET_REGISTRY_DIR=site/r facet list                # a local build
```

`r/` moves — every push to `main` republishes it. Every push also writes an immutable `r/<sha>/`
that never changes again, so a project that wants a registry that does not move under it pins one in
`facet.json`:

```json
{ "registry": "https://facet.astra-void.xyz/r/a1b2c3d" }
```

`add`, `diff`, and `doctor` all read that field, and
[revisions.json](https://facet.astra-void.xyz/revisions.json) lists what exists — see
[docs/decisions/registry-versioning.md](docs/decisions/registry-versioning.md).

## Theming

Roblox has no CSS variables, so the indirection that makes shadcn/ui themeable lives one layer down,
in `vela.config.ts`:

```ts
import { defineConfig } from "vela-rbxts";
import { facetTheme } from "@facet-ui/theme";

export default defineConfig({
  theme: { extend: { ...facetTheme({ base: "zinc", mode: "dark" }) } },
});
```

Components name roles (`bg-primary`), never ramp steps (`bg-zinc-900`). Switching `base` rethemes
every copied component without touching one of them. Because Vela resolves at compile time, a build carries
exactly one mode — see [docs/decisions/runtime-theming.md](docs/decisions/runtime-theming.md).

## Status

Early, but the whole chain works. All three packages are on npm and the registry is live, so
`npm i -D facet-rbxts` → `facet init` → `facet add button` → `rbxtsc` compiles in a project set up
from scratch. Every command the CLI advertises — `list`, `init`, `add`, `remove`, `diff`, `doctor` —
is written. The registry holds twenty-one components: the pure recipes (`alert`, `badge`, `card`,
`kbd`, `label`, `separator`, `skeleton`), the twelve built on one Lattice primitive (`accordion`,
`avatar`, `checkbox`, `progress`, `radio-group`, `scroll-area`, `slider`, `switch`, `tabs`,
`text-field`, `textarea`, `toggle-group`), `button`, `dialog`, and the `utils` and `text` helpers
they import.

`dialog` is the first layered one, and layered components need a `PortalProvider` above the app —
`facet add` offers to write it into your client entry.

What has *not* been checked is how most of it looks. `button`, `badge`, `card`, `label` and
`separator` have been through Studio; everything after them compiles and type-checks and has never
been on a screen. Compiling is a static result, and Roblox runtime behavior only shows up in Studio.
See [docs/roadmap.md](docs/roadmap.md).

## License

MIT
