# Conflicting classes

**Status:** settled. `cn` stays a flattener. Facet ships no `tailwind-merge` equivalent.

## Why shadcn needs one

On the web, the order of classes in the attribute means nothing. Tailwind emits utilities in a
canonical stylesheet order and the later *rule* wins, so `p-4 p-2` is 1rem of padding and `p-2 p-4`
is also 1rem of padding. `tailwind-merge` exists to make attribute order mean what everyone assumes
it already means — without it, a consumer's `className` cannot reliably override a recipe.

shadcn's `cn` is `clsx` + `twMerge` for that reason, and the reason does not survive the port.

## Why Facet does not

Vela resolves tokens left to right into instance properties, and a later token overwrites an earlier
one. Class order *is* specificity here. `fv` already appends the consumer's `className` last, so a
consumer override wins by construction — the behaviour `twMerge` simulates is native.

The cross-family cases agree with `twMerge` too, for the same reason:

```
px-4 p-2   → p-2 wins on both axes        (twMerge drops px-4; same result)
p-2 px-4   → x from px-4, y from p-2      (twMerge keeps both; same result)
w-fit w-9  → w-9                          (same family, later wins)
```

A merge pass would cost a token table that has to track every Vela family, kept in sync with a
compiler that is still adding families, to reproduce an outcome we already get.

## What it obliges us to do

One rule, and it is the whole price: **nothing may be appended after the consumer's `className`.**

State-derived classes go through the recipe's `className` slot, ahead of the consumer's:

```tsx
// wrong — the consumer cannot override the disabled look
cn(buttonVariants({ variant, size, className: props.className }), disabled && "bg-muted")

// right
buttonVariants({ variant, size, className: cn(disabled && "bg-muted", props.className) })
```

`button` had this backwards until this decision.

The same rule is why `TextSlot` takes no `className`: it is not the last writer, the call site is.
Vela lowers `className` where it is written, so `<TextSlot className={...}>` arrives as resolved
`TextColor3` / `TextSize` / `FontFace` props. Re-applying a class string inside would put `TextSlot`
after the call site and drop them.

## Revisit if

Vela stops resolving last-token-wins, or grows a mechanism that lets a recipe's own tokens land after
the consumer's. Either one breaks this silently — a consumer override that simply does nothing — so
it is worth re-reading this file whenever Vela's resolution order changes.
