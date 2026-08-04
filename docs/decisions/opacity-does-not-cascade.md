# `opacity-*` cascades, up to the children the compiler can see

**Status:** fixed in Vela. This page records what was wrong, what the fix is, and the one case
components still have to handle themselves.

## What it used to do

`opacity-50` lowered to `BackgroundTransparency` on the instance it was written on, and
`GroupTransparency` on a `canvasgroup`. That was all. It did not touch text, and it did not reach
children.

```tsx
<textlabel className="opacity-50" />                       // background only — text stayed solid
<frame className="opacity-50"><textlabel /></frame>        // the label was untouched
```

## What it does now

`opacity-*` fades everything the element draws, and composes into everything nested under it.

- Every channel the host paints itself: `BackgroundTransparency` everywhere, plus
  `TextTransparency` on `textlabel`/`textbutton`/`textbox`, `ImageTransparency` on
  `imagelabel`/`imagebutton`, and the `Transparency` of a `UIStroke` or `UIShadow` drawn with it.
  A `canvasgroup` still takes `GroupTransparency` alone, which already covers all of that.
- Every JSX element written underneath, recursively. Alpha multiplies the way CSS composites it, so
  `opacity-50` inside `opacity-50` lands at a quarter, and a child's own `bg-black/50` fades to
  `0.75` rather than being overwritten. A `canvasgroup` in the way ends the walk, because that one
  property already composites its subtree.
- Children written inside an expression count. `{cond && <X />}` and `{items.map(…)}` are nested
  JSX as far as the AST is concerned, so they are walked like any other child.
- A child whose `className` is only known at runtime is handed the alpha as `__velaOpacity`, and
  the runtime host composes what it resolves — variant rules included. The statically known half is
  composed by the transformer; neither side does it twice.

One thing that also had to be fixed to make any of this hold: `bg-slate-700` clears
`BackgroundTransparency`, so `opacity-50 bg-slate-700` used to come out opaque and
`bg-slate-700 opacity-50` did not. `opacity-*` is now held until the whole class list is read and
composed over whatever alpha the colors settled on, which is what Tailwind means by the two being
independent. Order no longer changes the result.

## What it still cannot reach

Two, and both now warn (`opacity-unreachable-child`) instead of silently doing nothing:

- **`{props.children}`** — an expression with no JSX in it. The elements exist at render time, not
  at compile time.
- **`<Button />`** — a component child. The instances it renders are created somewhere else.

This is the boundary the old note was circling: pushing transparency into children only works for
what the compiler can see. The answer was not to give up on it, but to walk everything that *is*
visible — which is most real markup — and to name what is left.

## Why not a CanvasGroup

`CanvasGroup.GroupTransparency` is the only Roblox property that means what CSS `opacity` means, and
getting one into the tree costs either a wrapper instance or swapping the element's class. Both were
rejected: a wrapper changes layout and `ZIndex` and remounts the subtree whenever a conditional
`opacity-*` toggles, and swapping `frame` for `canvasgroup` makes every `ref` type a lie and clips
descendants to the element's own rectangle. Multiplying alpha per instance is not a true composite —
overlapping siblings darken where they overlap — and that is the price paid instead.

## What components do with it

Apply the dimming once, at the top of what should fade, and let it fall through.

`button` dims itself with `opacity-50`; its own label fades with it now. Its `props.children` do
not, so a component that renders children into a faded surface still states the dimming on them —
which is what the warning asks for.

Where the fade has to cross a component boundary, the rule from §3 of
[registry-design.md](../registry-design.md) still holds: nothing inherits, so every instance states
its own appearance.
