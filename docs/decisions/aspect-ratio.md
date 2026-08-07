# No `aspect-ratio` component

**Status:** settled. `aspect-ratio` was on the build list and comes off it. Vela already lowers
`aspect-*` onto the native constraint, so the component would be a wrapper around one class.

## Why shadcn has one

CSS could not constrain a box's ratio for most of its life. The trick was a wrapper with
`padding-bottom: 56.25%` and an absolutely positioned child, which is fiddly enough that Radix
packaged it and shadcn re-exported the package. The component exists to hide a workaround.

## Why Facet does not

Roblox has `UIAspectRatioConstraint`, and Vela lowers straight onto it:

```
aspect-square    → UIAspectRatioConstraint.AspectRatio = 1
aspect-video     → 16 / 9
aspect-[4/3]     → 4 / 3
aspect-[1.5]     → 1.5
```

That is a class on the element that already exists. A `<AspectRatio>` component would add a frame to
the tree, a file to the consumer's project, and a level to the `AutomaticSize` chain — which
registry-design.md §2 spends a section on not breaking — to deliver something they can write on the
element they already have:

```tsx
<imagelabel className="w-full aspect-video" Image={thumbnail} />
```

The wrapper is also strictly less capable. The class works on any host instance; a component forces
whatever it wraps to sit inside a `Frame`.

This is registry-design.md §5's corollary in a new place: do not add an instance to carry what an
existing instance can carry.

## What it obliges

Nothing to build, one thing to write down: **ratio is a class, not a component.** It belongs in the
docs site's layout page when there is one, next to `w-full` and `size-fit`, rather than in the
registry.

## Revisit if

Vela drops the `aspect-*` family, or a Roblox-native composition turns up that genuinely needs a
ratio *plus* behaviour — a `viewport` framing a model, say. That would be that component's problem
to own, not a general `AspectRatio`'s.
