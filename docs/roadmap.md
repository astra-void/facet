# Roadmap

## Now — make one component real end to end

- [x] `facet list` — reads the published registry
- [x] `facet init` — writes `facet.json`, creates `vela.config.ts`, installs build deps, adds `utils`
- [x] `facet add` — resolves transitively, rewrites `~/`, writes as one transaction
- [ ] `facet doctor` — the checks `init` and `add` currently only warn about
- [ ] `facet remove`, `facet diff`
- [x] publish `@facet-ui/react-variants`, `@facet-ui/theme`, and `facet-rbxts`
- [x] verified end to end from npm: install the CLI in a bare project, `init`, `add button`, and
      `rbxtsc` emits Luau with the semantic tokens resolved
- [ ] verify `button` renders in `apps/playground` inside Studio — nobody has seen it yet
- [ ] a fixture project the CLI runs against in CI, so that end-to-end check stops being manual

`init` creates a Vela config when there is none but never rewrites one that exists, and only reports
on tsconfig rather than editing it. Both files belong to the consumer and are routinely JSONC or
non-trivial TypeScript; a pattern-matched edit that mangles one is worse than a printed snippet.
Revisit only with a real parser, not a smarter regex.

## Next — the registry itself

Ordered by how much each depends on a Lattice primitive that already exists.

**Nothing beneath them** (pure recipe + host element):

`badge` · `card` · `separator` · `skeleton` · `label` · `kbd` · `alert` · `aspect-ratio`

**One Lattice primitive**:

`avatar` · `checkbox` · `switch` · `progress` · `slider` · `toggle` · `toggle-group` · `tabs` ·
`accordion` · `text-field` · `textarea` · `radio-group` · `scroll-area`

**Layered — needs portals, focus trapping, or popper**:

`dialog` · `alert-dialog` · `popover` · `tooltip` · `dropdown-menu` · `context-menu` · `select` ·
`combobox` · `toast` · `sheet` · `command`

**Blocks** (multi-file compositions, once the singles settle):

`login-form` · `settings-panel` · `inventory-grid` · `shop-row`

Roblox-native additions with no shadcn counterpart, worth their own pass: `viewport` (ViewportFrame
with a model), `billboard`, `surface`, `player-list`, `hotbar`.

## Later — the parts that need a decision first

- **`facet diff`** blocks on provenance. A `facet.lock` recording the content hash of each file at
  copy time is the obvious answer; decide before shipping `add`, because `add` is what would write it.
- **Runtime theming** — see [decisions/runtime-theming.md](decisions/runtime-theming.md).
- **Icons.** shadcn leans on lucide. Roblox has no icon font; icons are image assets or a sprite
  sheet. Facet needs a position on this before any component that wants a chevron.
- **Registry versioning.** Open in [decisions/registry-hosting.md](decisions/registry-hosting.md);
  settle it alongside `facet diff`, which is what makes drift visible.
- **Docs site.** `facet.astra-void.xyz` currently serves the registry and a bare index. Real docs
  belong on the same host, with live previews if the Loom preview surface can render registry
  components.
- **`facet create`** — scaffold a new roblox-ts project preconfigured for Facet, as Lattice's CLI does.

## Open questions

- **Does `className` survive `asChild`?** Partly answered. The playground compiles it: Vela lowers
  `<Slot className={...}>` to `React.createElement(VelaRuntimeHost, { __velaTag = Slot, ... })`, so a
  component tag is structurally supported, and `TextSlot` proves the resolved props do reach a
  component and can be forwarded to an instance. What is still unverified is whether Lattice's `Slot`
  forwards them onto a child it does not own. Needs Studio, not a compiler.
- Does a Facet component ever take a `Text` prop, or does it always take children? Roblox
  `textbutton` wants `Text`; React composition wants children. `button` currently takes `Text` via
  passthrough. Settle this before ten components each answer it differently.
- Does `cn` need conflict resolution? Right now Vela's last-token-wins decides `p-2 p-4`. That is
  fine for recipes; it may not be for consumer overrides through `className`.
- One registry style or several? shadcn ships `default` and `new-york`. `facet.json` has the field;
  nothing uses it yet.
