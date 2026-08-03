# How a component takes its text

**Status:** settled. Every component that draws a string takes `Text?: string`. `children` stays the
composition slot.

## The constraint

shadcn's answer is children — `<Button>Save</Button>` — and it is not available here. roblox-ts
React's `ReactNode` has no string member, because host instances draw text from a `Text` property
rather than from a text node. Passing a string as a child is a `TS2747` no matter what the component
declares. This is not a Facet choice to make; it is the shape of the platform.

So the question is only how to spell the escape hatch, and how consistently.

## The decision

1. **`Text?: string`, on every component that draws text itself.** Always listed in that component's
   `OWN_PROPS`, so it never reaches the host instance by accident.
2. **`children` keeps shadcn's meaning** — composition. An icon, a nested element, anything that is
   not a bare string. `TextSlot` picks: `Text` when it is set, `children` otherwise.
3. **Two text regions means two components, never two props.** shadcn splits `AlertTitle` /
   `AlertDescription` and `CardTitle` / `CardDescription`; Facet follows. A component that grows a
   second string prop — `Text` plus `Description` — is a component that should have been split.

## Why uppercase, when every other Facet prop is lowercase

`variant`, `size`, `asChild`, `disabled` are lowercase because they are ours. Uppercase is the Roblox
namespace, which is exactly why `Text` belongs to it: `Text` is already a member of
`PassthroughProps<TextButton>` and `PassthroughProps<TextLabel>`.

Declare the prop as `text` and the name `Text` stays live on the passthrough path. A Roblox developer
writes `<Button Text="Save" />` — the obvious thing to write — and it lands on the host instance,
drawing Roblox's 8px near-black default underneath the styled label, with nothing in the source
explaining why. Declaring `Text` shadows that and intercepts it.

The name we would have to defend against is the name to take.

This is what retired `TextSlot`'s lowercase `text`: it wrote `Text={props.text}` *before* spreading
passthrough, so a stray `Text` silently won the very label the component was trying to style.

## What this does not claim

Not that `Text` is the nicer API. It is the only one the compiler allows, made uniform. If roblox-ts
React ever accepts string children, `TextSlot` already prefers `children` when `Text` is absent —
components would keep working while the registry moves over.

Related: [class-conflicts.md](class-conflicts.md) covers the other half of the `TextSlot` story, which
is why it takes no `className`.
