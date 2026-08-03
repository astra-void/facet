# Runtime theming

**Status:** open. Decided against for v0.1; revisit before any component needs it.

## The problem

Vela resolves `className` at compile time. `bg-primary` becomes a literal `Color3` in the emitted
Luau. A build therefore carries exactly one theme, and `facetTheme({ mode: "dark" })` is a build-time
choice, not a switch.

shadcn/ui gets runtime theming for free because CSS variables are resolved by the browser on every
paint. Roblox has no equivalent indirection.

## Why it might matter

Games do want this — a settings menu with a light/dark toggle, or UI that tints to match a team
color. If Facet has no answer, every consumer invents one, and they will invent it by editing the
copied components, which is exactly the edit Facet's theming is supposed to prevent.

## Options

**1. Do nothing.** One mode per build. Simplest, and correct for most games, which pick a look and
keep it.

**2. Runtime ThemeProvider alongside classes.** A React context supplies `Color3` values; components
read it for the handful of props that need to change and use classes for everything else. Splits the
styling story in two — the failure mode is a component whose background is themeable and whose border
is not, with nothing in the source explaining which is which.

**3. Vela emits a token indirection.** Instead of lowering `bg-primary` to a literal, lower it to a
read from a runtime token table that the consumer can swap. This is the honest fix, and it is a Vela
change, not a Facet one — which also means Facet cannot make it unilaterally.

## Leaning

Option 1 now, option 3 eventually. Option 2 is the tempting one and probably the trap: it buys
runtime theming at the cost of the single property that makes the copy-in model work, which is that
a component's appearance is entirely described by its classes.

If option 3 becomes real in Vela, `@facet-ui/theme` is the natural place to define which tokens are
runtime-swappable, and no registry component changes.
