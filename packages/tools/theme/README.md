# @facet-ui/theme

Facet's semantic theme tokens, shaped as a [Vela](https://github.com/astra-void/vela-rbxts) config
preset. This is Facet's answer to shadcn/ui's `:root { --primary: ... }` block — Roblox has no CSS
variables, so the indirection lives in `vela.config.ts` and is resolved at compile time.

```ts
// vela.config.ts
import { defineConfig } from "vela-rbxts";
import { facetTheme } from "@facet-ui/theme";

export default defineConfig({
  theme: {
    extend: {
      ...facetTheme({ base: "zinc", mode: "dark" }),
    },
  },
});
```

`facet init` writes this block for you.

## Tokens

`background` `foreground` `card` `card-foreground` `popover` `popover-foreground` `primary`
`primary-foreground` `secondary` `secondary-foreground` `muted` `muted-foreground` `accent`
`accent-foreground` `destructive` `destructive-foreground` `border` `input` `ring`

Every Facet component names only these. Nothing in the registry says `zinc-800`, which is what lets
`base: "slate"` retheme a project without touching a single copied-in component.

## One mode per build

Vela resolves classes at compile time, so a build carries exactly one mode — `mode: "dark"` is not a
runtime toggle. Runtime light/dark switching would need a second mechanism layered on top; see
`docs/decisions/runtime-theming.md`.

## Overriding

`facetTheme()` returns a plain object. Spread it, then override whatever you want:

```ts
extend: {
  ...facetTheme({ base: "slate" }),
  colors: {
    ...facetTheme({ base: "slate" }).colors,
    primary: "Color3.fromRGB(88, 101, 242)",
    "primary-foreground": "Color3.fromRGB(255, 255, 255)",
  },
}
```
