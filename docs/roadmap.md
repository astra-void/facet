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

- **Does `className` survive `asChild`?** **Yes — and `asChild` is still broken, for an unrelated
  reason.** Verified in Studio against a bare `<textbutton>` child:
  `<Slot className="h-8 w-fit bg-secondary">` resolved onto the child as `BackgroundColor3`
  0.153/0.153/0.165, `Size` `{0,0},{0,32}`, `AutomaticSize.X`. Class-to-prop lowering crosses `Slot`
  intact.

  Adding one class that lowers to a modifier *child* — `rounded-md`, `flex-row`, `px-3` — fails with
  `[Slot] expected exactly one child element besides any UI modifiers.` The cause is a case mismatch
  in Lattice, not in Vela or here: `slot.luau`'s `UI_MODIFIER_TAGS` is keyed by lowercase JSX tag
  names (`uicorner`, `uilistlayout`), and `isUiModifierElement` looks the element's `type` up in it
  directly — but roblox-ts React elements carry the Roblox class name. An instrumented probe printed
  `UIListLayout`, `UICorner`, `UIPadding`, `TextButton`. Every modifier therefore reads as a second
  target candidate.

  Every Facet recipe emits at least a `UIListLayout` or a `UICorner`, so this is not a corner case:
  `asChild` cannot work on any of them until Lattice's lookup is case-correct. Report it upstream;
  the fix is the tag table, and nothing in the registry needs to change to receive it. `Button` keeps
  its `asChild` branch in the meantime — the code is right, the dependency is not.
Settled, with the reasoning kept where it can be argued with:

- **Text is a prop, not children** — [decisions/text-api.md](decisions/text-api.md). `Text?: string`
  on every component that draws a string; `children` stays composition.
- **`cn` does not resolve conflicts** — [decisions/class-conflicts.md](decisions/class-conflicts.md).
  Vela's last-token-wins is what `tailwind-merge` exists to fake, so the obligation is ordering
  discipline instead: nothing lands after the consumer's `className`.
- **One registry style** — [decisions/registry-styles.md](decisions/registry-styles.md). The field
  stays in `facet.json`; a second style does not arrive.
