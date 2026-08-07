# The Luau register limit

**Status:** settled, and it is a constraint rather than a preference. A component file gets one
exported recipe *object*, not one export per part. `card.tsx` and `alert.tsx` are written this way
because the alternative does not load.

## The limit

Luau allows 200 local registers per function, and a module body is a function. Every module-scope
`local` in the emitted Luau takes one — including every `export const`, since roblox-ts lowers an
export to a local plus an assignment into the module table.

That budget would be enormous for a component. It is not, because the component does not get all of
it.

## What Vela puts in the file

Vela lowers `className` at compile time where it can, but every Facet class string comes out of
`fv()`, which makes it a computed expression — so it resolves at runtime instead, and the runtime
that resolves it is **inlined into every file that needs it**. There is no shared module to import;
each transformed file carries its own copy.

In Vela 0.8.0 that copy declared roughly 96 module-scope locals before the file's own first line.
`card` — six exported parts, six recipes — went over 200 and stopped loading, with an error naming
generated code the author never wrote:

```
Out of local registers when trying to allocate CardHeader
```

Not a compile error. The module simply failed at load.

Vela 0.9.0 scopes the inlined runtime into a single initializer, and emitted components now sit
around 18-24 module-scope locals total — which is why the floor is 0.9.0 and not 0.8.0
(`core/requirements.ts`).

## What it obliges

**One recipe object per file.** Six `export const`s cost six registers; one object costs one:

```ts
export const cardVariants = {
  root: fv(...),
  header: fv(...),
  title: fv(...),
};
```

The parts themselves stay flat named exports — `CardHeader`, not `Card.Header` — because that is
what a consumer edits and deletes (registry-design.md §6). Functions cost registers too, so a
component with many parts is spending its budget on the thing that matters rather than on recipes.

**Measure rather than assume.** The count is in the emitted file:

```bash
grep -c "^local " apps/playground/out/shared/ui/card.luau
```

A number in the twenties is normal on 0.9.0. A number near 200 means the next part added to that
component is the one that breaks it.

## Revisit if

Vela stops inlining its runtime per file — a shared runtime module would hand the whole 200 back,
and this file becomes a historical note rather than a rule. Until then, a component that wants
twenty parts needs to be several components.
