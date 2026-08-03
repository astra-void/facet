# One registry style

**Status:** settled. `facet.json` keeps its `style` field, pinned to `"default"`. There will not be a
second style.

## What shadcn did with the field

shadcn shipped two styles, `default` and `new-york`, and has since
[deprecated `default`](https://ui.shadcn.com/docs/components-json) — new projects get `new-york`. The
field outlived the second style.

That is the whole argument. The one project with the scale to maintain two visual languages across a
registry decided not to, and it decided that with CSS, where a style is a difference in class strings
and a reviewer can see both in a browser tab.

## Why it is worse here

Nothing about a Roblox component is verifiable by reading it. A second style doubles the set of
components that have to be opened in Studio and looked at, and Studio is already the expensive,
manual, uncompleted step — see [../roadmap.md](../roadmap.md), where a single `button` is still
waiting for someone to see it.

Facet has five components and zero confirmed renders. Spending the next unit of effort on a second
look for the same five is the wrong trade by a wide margin.

## Why the field stays anyway

`facet.json` is a file consumers commit. Removing a key from it is a breaking change for the benefit
of deleting one line, and the key is the natural place for a fork or a private registry to say what
it serves.

Nothing in the CLI branches on `style` today, and nothing should until a second style actually
exists. It is typed as the literal `"default"` in
[config.ts](../../packages/tools/cli/src/core/config.ts) rather than `string`, so any code that
starts branching on it has to change the type first — which is the point at which someone rereads
this file.
