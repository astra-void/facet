# @facet-ui/react-variants

Variant recipes and className composition for [Facet](../../../README.md) components.

This is Facet's `class-variance-authority` equivalent, adapted to roblox-ts. It is the one runtime
package Facet components import — everything else a component needs is either a Lattice primitive or
a Vela class string.

```tsx
import { fv, type VariantProps } from "@facet-ui/react-variants";

const buttonVariants = fv("inline-flex items-center justify-center rounded-md font-medium", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      outline: "border border-input bg-background hover:bg-accent",
      ghost: "hover:bg-accent hover:text-accent-foreground",
    },
    size: {
      sm: "h-8 px-3",
      md: "h-9 px-4",
      lg: "h-10 px-6",
    },
  },
  defaultVariants: { variant: "default", size: "md" },
});

type ButtonVariants = VariantProps<typeof buttonVariants>;

buttonVariants({ variant: "outline", size: "lg", className: "w-full" });
```

## Why classes and not style objects

Recipes hold no color, size, or font value of their own. They name tokens; Vela resolves those
tokens at compile time from the consumer's `vela.config.ts`. That is what makes a copied-in
component themeable without the consumer editing the component — they edit their theme.

## `cn` does not merge conflicts

`cn` flattens `ClassValue`s into a class string. It deliberately does *not* implement
`tailwind-merge`-style conflict resolution: which of `p-2 p-4` wins is Vela's call, not this
package's. Recipes are written so later slots append rather than fight.
