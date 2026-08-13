# Vela's shadow scale is Tailwind v3's, and shadcn is on v4

Vela lowers `shadow-*` onto a `UIShadow`, so shadows *are* expressible — earlier notes in this
repo that said otherwise were wrong. What is not expressible is a straight copy of shadcn's class,
because the two projects are one rename apart.

## The rename

Tailwind v4 inserted a step at the bottom of the shadow scale and pushed every name below `md` down
one. Vela implements the v3 names. The presets it emits:

| Vela token | `UIShadow` | Tailwind v3 | shadcn (v4) writes |
| --- | --- | --- | --- |
| `shadow-sm` | blur 2, offset (0,1), transparency .95 | `shadow-sm` | `shadow-xs` |
| `shadow` | blur 3, offset (0,1), transparency .9 | `shadow` | `shadow-sm` |
| `shadow-md` | blur 6, offset (0,4), spread −1 | `shadow-md` | `shadow-md` |
| `shadow-lg` | blur 15, offset (0,10), spread −3 | `shadow-lg` | `shadow-lg` |
| `shadow-xl` | blur 25, offset (0,20), spread −5 | `shadow-xl` | `shadow-xl` |
| `shadow-2xl` | blur 50, offset (0,25), spread −12 | `shadow-2xl` | `shadow-2xl` |
| `shadow-none` | `Enabled = false` | `shadow-none` | `shadow-none` |

So when porting a component:

- shadcn `shadow-xs` → **`shadow-sm`**
- shadcn `shadow-sm` → **`shadow`**
- `md` and above are the same word in both.

There is no Vela equivalent of v4's `shadow-2xs`, and `shadow-xs` is not a token at all — Vela reads
the `xs` as a *colour* key and warns `unknown-theme-key ... for shadow color utility`.

## Why this was easy to get wrong

Vela only type-checks `className` **string literals**. Every registry component builds its classes
through `fv()`, so the token list lives inside a function call and the compiler never inspects it —
a wrong token there produces no diagnostic and no shadow, silently.

The way to check a class before putting it in a recipe is to put it in a literal first:

```tsx
// a scratch file in apps/playground/src/client, deleted afterwards
<frame className="shadow-xs" />
```

and read the compiler output. `pnpm --filter @facet-ui/playground build` surfaces the warning, and
the generated Luau under `apps/playground/out` shows what the token actually became.
