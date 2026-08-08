# Roadmap

## Now — make one component real end to end

- [x] `facet list` — reads the published registry
- [x] `facet init` — writes `facet.json`, creates `vela.config.ts`, installs build deps, adds `utils`
- [x] `facet add` — resolves transitively, rewrites `~/`, writes as one transaction
- [x] `facet doctor` — the checks `init` and `add` currently only warn about, plus the one neither
      could make: whether the packages under the copied files still meet the floors those files
      need. That is the check that catches a project set up by an older CLI
- [x] `facet remove` — refuses a file that differs from the registry without `--force`, and a file
      another installed component still imports at all. The second check runs to a fixed point: a
      dependency that looked free stops being free once the component importing it is kept back
- [x] `facet diff` — compares against the registry as it stands today, replaying the `~/` rewrite
      first so a project's own alias and directory choices are not reported as changes. It says in
      its own output that it cannot tell "I edited this" apart from "upstream changed"
- [x] publish `@facet-ui/react-variants`, `@facet-ui/theme`, and `facet-rbxts`
- [x] verified end to end from npm: install the CLI in a bare project, `init`, `add button`, and
      `rbxtsc` emits Luau with the semantic tokens resolved
- [x] verified in Studio: `button`, `badge`, `card`, `label`, and `separator` all render, and every
      label resolves to SourceSansPro at its recipe's size. Reading the emitted Luau was not enough —
      `card`'s description had no `font-*`, so it kept Roblox's LegacyArial default and was the only
      thing on screen in another typeface
- [x] a fixture project the CLI runs against in CI, so that end-to-end check stops being manual.
      `test/e2e.test.ts` builds a registry into a temporary directory and puts a project through
      `init`, `add` and `doctor` against it, offline — packages are faked into `node_modules` at
      chosen versions, which is the only way to assert on a project sitting below a floor. What it
      does not cover is `rbxtsc` compiling the result; the playground build is what checks that,
      and `ci.yml` now runs both on every branch and pull request rather than only on a deploy

`init` creates a Vela config when there is none but never rewrites one that exists, and only reports
on tsconfig rather than editing it. Both files belong to the consumer and are routinely JSONC or
non-trivial TypeScript; a pattern-matched edit that mangles one is worse than a printed snippet.
Revisit only with a real parser, not a smarter regex.

- [x] the one exception, and it came with the parser: `facet add` wraps the client entry in the
      providers a component declares. `dialog` needs one, and a missing `PortalProvider` is the only
      thing on this list that fails at *runtime* — it compiles, ships, and throws when a player
      opens the dialog — so a printed snippet is not enough. `@babel/parser` answers where the
      imports end and where the render call's argument starts; the edit is two string splices and
      everything else comes out byte for byte identical. Two render calls, no `PlayerGui` to pass,
      or no entry at all and it reports instead of guessing. Behind a prompt, `--yes` to skip it,
      and never on a non-interactive run without one. Not `typescript`, for the record: roblox-ts
      pins that to an exact version, so a caret range here is a second 24 MB copy rather than a
      shared one. See
      [decisions/provider-wiring.md](decisions/provider-wiring.md)

## Next — the registry itself

Ordered by how much each depends on a Lattice primitive that already exists.

**Nothing beneath them** (pure recipe + host element) — done: `badge` · `card` · `separator` ·
`skeleton` · `label` · `kbd` · `alert`.

`aspect-ratio` came off this list rather than getting built: Vela lowers `aspect-*` onto
`UIAspectRatioConstraint`, so the component would be a wrapper frame around one class — see
[decisions/aspect-ratio.md](decisions/aspect-ratio.md).

**One Lattice primitive** — built, pending Studio verification: `avatar` · `checkbox` · `switch` ·
`progress` · `slider` · `toggle-group` · `tabs` · `accordion` · `text-field` · `textarea` ·
`radio-group` · `scroll-area`. All twelve compile through `rbxtsc` and render in the playground
scenes; what Studio still has to answer is the geometry the type system cannot see — thumb travel,
range fill, scrollbar placement, textarea growth.

Three things every one of them needed, written down once here rather than twelve times in the files:

- **State a component styles by is mirrored, not reached for.** Lattice keeps its contexts private,
  so a wrapper that colours a checked box or highlights a selected trigger holds the value itself
  with `useControllableState` — the same hook the primitive uses — and drives the primitive
  controlled. One copy of the state, and it lives in the Facet file.
- **`className` on a primitive call site must be visible to the transformer.** Vela rewrites the
  call sites it can see; a `className` tucked into a shared spread reaches the primitive as a raw
  prop and is silently dropped. Write it as an attribute.
- **Forwarded props cross a component boundary widened.** The typed passthrough bag collides with
  the runtime host's `ref` and with primitives that type `children` as a single element; `toSlotProps`
  (and, where the primitive's `children` is a single element, a local `forwardProps`) is the
  crossing point.

`toggle` came off this list without being built: `@lattice-ui/react-toggle` does not exist, and a
standalone pressed state is exactly the controlled/uncontrolled logic the layer boundaries say
belongs in Lattice, not here. It returns when the primitive does — or a consumer can reach for a
one-item `toggle-group` today.

**Layered — needs portals, focus trapping, or popper**:

`dialog` is built, pending Studio verification. Remaining: `alert-dialog` · `popover` · `tooltip` ·
`dropdown-menu` · `context-menu` · `select` · `combobox` · `toast` · `sheet` · `command`.
(`dropdown-menu` will wrap `@lattice-ui/react-menu`; there is no `react-dropdown-menu`, and
`alert-dialog` and `sheet` are both `react-dialog` again with different chrome.)

Three things `dialog` established that the rest of this tier inherits:

- **A `PortalProvider` has to be above the app.** `Dialog.Portal` reads a strict context for the
  `BasePlayerGui` it renders into, so an app that mounts any layered component wraps its tree once
  with `<PortalProvider container={playerGui}>`. Missing it throws on open rather than rendering
  nowhere. The playground root does it for every scene, not just the dialog's — and the registry
  entry declares it, so `facet add` offers to write it and `facet doctor` notices when it is gone.
  The rest of this tier declares the same one and it is written once.
- **The styled panel is a frame *inside* `Dialog.Content`, never `Dialog.Content` itself.** The
  primitive forces `Size` on its own host so the layer spans the screen, and it takes the first host
  element under it as the boundary an outside press is measured against. A `className` there fights
  the first, and — through the `UICorner` Vela prepends for `rounded-*` — silently becomes the
  second. The panel centres itself with `mx-auto my-auto`, which Vela lowers to `AnchorPoint` 0.5
  plus `Position` 0.5.
- **A class forwarded to another component has to reach one `className` expression.** Vela resolves
  a `className` at the call site and hands the component the resolved *properties*, so a class
  routed through a wrapper's `className` prop is overwritten by that wrapper's own recipe. This is
  §4 of [registry-design.md](registry-design.md) — the `TextSlot` trap — one level up. `dialog`
  spells the prop `overlayClassName` and merges it where the overlay actually resolves.

What Studio still has to answer is the geometry: whether the panel lands centred, whether the dim
covers the screen beneath it, and whether the close ✕ sits at the panel's right edge.

**The corner ✕ is not a corner ✕.** shadcn floats it over the panel's top-right; a `UIListLayout`
positions every child it has, so a floating child inside a `flex-col` panel is not expressible
without a second frame purely to escape the layout — which is the wrapper §5 says not to add. It
takes its own line at the top instead, pushed right by `self-end` (a `UIFlexItem`). `showClose`
turns it off for a dialog whose only way out is a footer button.

**Blocks** (multi-file compositions, once the singles settle):

`login-form` · `settings-panel` · `inventory-grid` · `shop-row`

Roblox-native additions with no shadcn counterpart, worth their own pass: `viewport` (ViewportFrame
with a model), `billboard`, `surface`, `player-list`, `hotbar`.

## Later — the parts that need a decision first

- **Runtime theming** — see [decisions/runtime-theming.md](decisions/runtime-theming.md).
- **Docs site.** `facet.astra-void.xyz` serves the registry, its revisions, the config schema and a
  bare index. Real docs belong on the same host, with live previews if the Loom preview surface can
  render registry components. The one item on this list with nothing decided and nothing built.
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
- **A revision is a commit, and pinning is a field that existed** —
  [decisions/registry-versioning.md](decisions/registry-versioning.md). Every push publishes an
  immutable `r/<sha>/` beside the moving `r/`; `registry` in `facet.json` points at one. No CLI
  change and no format change, so a CLI released months ago can pin today.
- **Icons are text glyphs, replaceable by slot** — [registry-design.md](registry-design.md) §7.
  Roblox has no icon font and shipping images means owning the upload, the moderation and the
  licensing forever, so components draw `▾`, `✓`, `✕` as text and expose the slot for a project that
  has its own artwork. This was listed as blocking the layered components; it does not.
- **Ratio is a class, not a component** — [decisions/aspect-ratio.md](decisions/aspect-ratio.md).
- **The scrim is black, and it is the one class that names a colour** —
  [decisions/overlay-scrim.md](decisions/overlay-scrim.md). Every role flips with the theme, so none
  of them darkens in both modes; a token was not added for one class in one component.
  `overlayClassName` is the way out.
- **One recipe object per component file** — [decisions/luau-register-limit.md](decisions/luau-register-limit.md).
  Vela inlines its runtime per file and Luau allows 200 module-scope locals, so every export costs a
  register. `card` stopped loading over exactly this.
- **Nothing is recorded at copy time** — [decisions/provenance.md](decisions/provenance.md). No
  `facet.lock`, no content hashes: a hash answers whether a file changed, and a diff has to show
  how, so the record that would satisfy `facet diff` is a second copy of every component in the
  consumer's repo. The cost is that `diff` reports drift without attributing it.
