---
"@facet-ui/react-variants": patch
---

Fix `fv()` failing to type-check when called with no variants.

`VariantSelection` mapped over `VariantShape`'s string keys produces an index
signature of `string | undefined`, which collides with the `className` slot on
the selection object. Defaulting the type parameter to `Record<never, never>`
keeps the selection object free of an index signature, so `fv("base")` — a
recipe that only ever emits one class list — works at its call sites.
