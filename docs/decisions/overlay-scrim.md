# The scrim is black, and it is the one class that names a colour

`registry-design.md` §8 says roles, never ramp steps: `bg-muted`, not `bg-zinc-800`, because that is
what lets `facetTheme({ base: "slate" })` retheme every copied component without editing one.
`dialog`'s overlay breaks it:

```ts
overlay: fv("bg-black/80"),
```

## Why no role works

The overlay is the dim behind a modal. It has to darken whatever is under it, in every theme.

Facet's token set has nineteen roles and not one of them is dark in both modes, because that is the
point of a role — it flips with the theme:

| candidate           | dark mode      | light mode     |
| ------------------- | -------------- | -------------- |
| `bg-background/80`  | zinc-950 ✓     | white ✗        |
| `bg-foreground/80`  | zinc-50 ✗      | zinc-950 ✓     |
| `bg-muted/80`       | zinc-800 ✓     | zinc-100 ✗     |

Each of them is correct in exactly one mode and washes the screen out in the other. A role that
happened to stay dark in both would be a role whose two definitions had drifted — a bug in the
theme, not a foundation to build on.

## Why not add a token

`overlay` could join `FACET_TOKENS` as a role that is dark in both modes. It was not added because a
token is a published surface: `facet doctor` checks a project's Vela theme against the tokens each
installed component names, `@facet-ui/theme` ships the defaults, and every project that upgrades
inherits it. That is a large, permanent commitment for one class in one component, and the thing it
would encode — "a scrim is dark" — is not a decision any consumer will want to retheme.

If a second and third layered component turn out to want it too — `sheet` and `drawer` both draw a
dim — the token is the right answer and this file is where the argument restarts.

## The escape hatch

`DialogContent` takes `overlayClassName`, and it is spelled that way on purpose: Vela intercepts a
prop named `className` at the call site and hands the component the resolved *properties* rather
than the string, so a class routed through a second component's `className` gets overwritten by that
component's own recipe. `overlayClassName` is not `className`, so it arrives intact and merges into
the single expression that resolves the overlay.

```tsx
<DialogContent overlayClassName="bg-background/60">
```

The recipe is also exported as `dialogVariants.overlay`, and the file is yours once copied. Nothing
here is load-bearing except the reason.
