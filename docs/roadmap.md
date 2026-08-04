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
- [x] verified in Studio: `button`, `badge`, `card`, `label`, and `separator` all render, and every
      label resolves to SourceSansPro at its recipe's size. Reading the emitted Luau was not enough —
      `card`'s description had no `font-*`, so it kept Roblox's LegacyArial default and was the only
      thing on screen in another typeface
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

- **Does `className` survive `asChild`?** **Yes, and `asChild` works** as of Lattice 0.8.0.
  Verified in Studio against a bare `<textbutton>` child, which carries no styling of its own: the
  cloned instance came out with `BackgroundColor3` 0.153/0.153/0.165 (`bg-secondary`), `Size`
  `{0,0},{0,32}` and `AutomaticSize.X` (`h-8 w-fit`), `bg-secondary/80` on hover, and
  `UIListLayout`, `UICorner` and `UIPadding` re-parented underneath it.

  It was broken for a reason unrelated to `className`: Lattice keyed its UI modifier table by the
  lowercase JSX tag, while roblox-ts labels a host element with its Roblox class name, so
  `<uicorner />` arrived as `"UICorner"`, missed the lookup, and counted as a second slot target.
  Every Facet recipe emits at least a `UIListLayout` or a `UICorner`, so no component could use
  `asChild` at all. Fixed upstream in `@lattice-ui/react-runtime` 0.8.0.

  **What `asChild` does not carry is the label.** The chrome comes from the recipe, but the child
  draws its own text and `TextSlot` never renders, so `buttonLabelVariants` — colour, size, weight
  — is not applied and the text falls back to Roblox's 8px near-black default. On a dark surface it
  is invisible. This is §3 of [registry-design.md](registry-design.md) again: nothing inherits, so a
  consumer reaching for `asChild` states the text styling on their own element. Whether the registry
  should make that easier — exporting the label recipe, or documenting the pairing — is open.

Settled, with the reasoning kept where it can be argued with:

- **Text is a prop, not children** — [decisions/text-api.md](decisions/text-api.md). `Text?: string`
  on every component that draws a string; `children` stays composition.
- **`cn` does not resolve conflicts** — [decisions/class-conflicts.md](decisions/class-conflicts.md).
  Vela's last-token-wins is what `tailwind-merge` exists to fake, so the obligation is ordering
  discipline instead: nothing lands after the consumer's `className`.
- **One registry style** — [decisions/registry-styles.md](decisions/registry-styles.md). The field
  stays in `facet.json`; a second style does not arrive.
