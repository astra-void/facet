# Registry design

Conventions every component in `registry/src` follows. Most of them exist because a web instinct is
wrong on Roblox; each one below says which instinct it corrects.

## 1. Declare both axes. Always.

Vela resolves a frame's size starting from `UDim2.new(0, 0, 0, 0)`. Nothing infers a size from
content unless you ask for it, and **`UIPadding` does not grow a frame** — it insets its children.

So `h-9 px-4`, which is a perfectly good shadcn button, renders **zero pixels wide** here. That is
not hypothetical; it is what the first published `button` did.

```
h-9 px-4                        → 0 x 36. Invisible.
h-9 + AutomaticSize={...X}      → hugs its content. Correct.
h-9 w-9                         → fixed square. Also correct.
```

Every leaf declares a width *and* a height: a concrete class on each axis, or `AutomaticSize` for the
axis that should hug.

## 1a. `w-fit` does not work in a Facet component

Vela lowers `fit`/`auto` to `AutomaticSize` **only when the class string is a static literal.** Its
runtime path — taken whenever `className` is a computed expression — resolves `fit` to "no size
contribution" and never sets `AutomaticSize` at all. Verified in the emitted Luau:

```lua
-- static:  <frame className="w-fit h-9" />
Size = UDim2.fromOffset(0, 36), AutomaticSize = Enum.AutomaticSize.X   -- correct

-- dynamic: <frame className={cn("w-fit h-9", ...)} />
if key == "fit" then return nil end   -- and nothing sets AutomaticSize
```

Every Facet class string comes out of `fv()`, so every Facet component is on the dynamic path.
**`w-fit`, `h-fit`, and `size-fit` are dead tokens here.** Do not write them; they read as intent
that the build silently drops.

Set the instance prop instead — it survives the runtime host untouched:

```tsx
<textbutton className={buttonVariants({ ... })} AutomaticSize={Enum.AutomaticSize.X} />
```

This is a gap in Vela's runtime, not a fact about Roblox. If Vela's runtime host learns `fit`/`auto`,
this section collapses back into a class and the components get simpler.

## 2. `AutomaticSize` is a chain, and it breaks at the first weak link

A container set to hug its content can only measure children that already know their own size. One
child with an unresolved axis and the parent collapses. When a component nests — button → label,
card → header → title — every level needs an answer, not just the outermost one.

## 3. Nothing inherits

There is no cascade. `text-sm` on a button does not reach the label inside it; text properties belong
to the instance that draws the text.

The consequence: **a component with a label needs a second recipe for that label.** `buttonVariants`
sizes the button, `buttonLabelVariants` styles the text, and both key off the same `size` prop. This
is the single biggest structural difference from shadcn, where one class list on the parent styles
everything under it.

## 4. Text arrives as a prop, and renders as a child instance

`<Button>Save</Button>` does not compile. roblox-ts React's `ReactNode` is
`ReactElement | ReactFragment | ReactPortal | boolean | undefined` — no string member, because host
instances draw text from a `Text` property rather than from text nodes. TypeScript intersects a
component's `children` with `React.Attributes["children"]`, so widening the component's own type does
not help either; it is `TS2747` either way.

Text therefore comes in as a `Text` prop. It is still drawn as a **child `textlabel`** rather than
the parent's own `Text`, which is what lets the label be sized and coloured independently and sit
beside an icon:

```tsx
<Button Text="Save" />
<Button Text="Save"><Icon glyph="check" /></Button>
```

`~/lib/text`'s `TextSlot` owns that: given `text` it renders the styled label, otherwise `children`.

## 5. Layout is an instance, not a property

`flex-row`, `items-*`, `justify-*`, `gap-*` all lower onto a single `UIListLayout` child. **One
instance can hold one layout.** A component that sets any of them owns the arrangement of its
children, and a consumer who wants a different one has to replace the component's layout classes
rather than add to them.

Corollary: do not add a wrapper frame just to get a second layout. Restructure the parts instead.

## 6. Flat named exports

`Card`, `CardHeader`, `CardTitle` — not `Card.Root`. Lattice uses namespace objects and that is right
for a library; this is source someone pastes into their project and edits, so it matches shadcn,
where each part reads independently and can be deleted on its own.

Facet components wrap Lattice's namespaces:

```tsx
import { Dialog as DialogPrimitive } from "@lattice-ui/react-dialog";

export const Dialog = DialogPrimitive.Root;
export function DialogContent(props: DialogContentProps) { /* styled */ }
```

## 7. Icons are text glyphs by default, replaceable by slot

Roblox has no icon font and no free lunch: shipping images means uploading assets to somebody's
account and owning the moderation and licensing forever. Facet renders `▾`, `✓`, `✕` as text and
exposes the slot, so a project that wants real artwork passes its own.

## 8. Roles, never ramp steps

`bg-muted`, not `bg-zinc-800`. This is what makes `facetTheme({ base: "slate" })` retheme every
copied component without editing one of them. Enforced by review, not by tooling — the class strings
are just text.

## 9. `ClassValue` is a reserved name

Vela inlines its runtime into every file it transforms, and that runtime declares a local
`ClassValue`. A component importing that name gets `TS2440: Import declaration conflicts with local
declaration`. `~/lib/utils` re-exports it as **`ClassName`** for this reason — use that.

## 10. Every import is declared

An import a component makes must appear in `registry/registry.ts` as a `dependency` (npm) or a
`registryDependency` (another item). An undeclared one ships a file that cannot compile in a project
that did not happen to have it already. `pnpm registry:check` catches unresolvable registry
dependencies; it cannot catch a missing npm one, so that part is on the author.

## Anatomy

```tsx
import { fv, type VariantProps } from "@facet-ui/react-variants";
import { getPassthroughProps, React } from "@lattice-ui/react-runtime";
import { TextSlot } from "~/lib/text";
import { cn } from "~/lib/utils";

// 1. geometry + surface on the root. No `w-fit` — see §1a.
export const thingVariants = fv("flex-row items-center rounded-md", { variants: { ... } });

// 2. a matching recipe for any text this component draws itself
export const thingLabelVariants = fv("text-foreground", { variants: { ... } });

export type ThingProps = VariantProps<typeof thingVariants> & { Text?: string; ... };

const OWN_PROPS = ["variant", "size", "className", "Text", "children"] as const;

// 3. neutralize Roblox's own look, never the consumer's
const NEUTRAL_PROPS = { BackgroundTransparency: 1, BorderSizePixel: 0 };

export function Thing(props: ThingProps) {
  const passthrough = getPassthroughProps<Frame>(props, OWN_PROPS);
  return (
    <frame
      className={thingVariants({ variant: props.variant, className: props.className })}
      {...NEUTRAL_PROPS}
      AutomaticSize={Enum.AutomaticSize.X}
      {...passthrough}
    >
      <TextSlot text={props.Text} className={thingLabelVariants({ size: props.size })}>
        {props.children}
      </TextSlot>
    </frame>
  );
}
```

Spread order is neutral defaults → consumer passthrough → behavior props, so consumers can override
appearance but never behavior.

## Build order

Grouped by what each one needs underneath it. Earlier groups are not just easier — they are how the
conventions above get proven before anything complicated depends on them.

**No primitive underneath** — pure recipe plus a host element:
`badge` · `card` · `separator` · `skeleton` · `label` · `alert` · `kbd` · `aspect-ratio`

**One Lattice primitive**:
`avatar` · `checkbox` · `switch` · `progress` · `slider` · `toggle` · `toggle-group` · `tabs` ·
`accordion` · `text-field` · `textarea` · `radio-group` · `scroll-area`

**Layered — portals, focus trapping, popper**:
`dialog` · `alert-dialog` · `popover` · `tooltip` · `dropdown-menu` · `context-menu` · `select` ·
`combobox` · `toast` · `sheet` · `command`

**Blocks**, once the singles settle: `login-form` · `settings-panel` · `inventory-grid` · `shop-row`

Roblox-native additions with no shadcn counterpart deserve their own pass rather than being wedged
into this list: `viewport` (a `ViewportFrame` with a model), `billboard`, `surface`, `player-list`,
`hotbar`.

## Definition of done, per component

1. source in `registry/src/ui`
2. entry in `registry/registry.ts` with dependencies and tokens
3. a scene in `apps/playground` — this is the only place anyone sees it render
4. `pnpm check` and `pnpm --filter @facet-ui/playground build` both clean
