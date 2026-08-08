# The CLI edits one file it did not write

`init` creates `vela.config.ts` when there is none and never rewrites one that exists. It reports on
`tsconfig.json` rather than editing it. The reasoning, from the roadmap:

> Both files belong to the consumer and are routinely JSONC or non-trivial TypeScript; a
> pattern-matched edit that mangles one is worse than a printed snippet. Revisit only with a real
> parser, not a smarter regex.

`dialog` is the case that made it worth revisiting.

## Why a snippet is not enough here

Every other thing the CLI reports is a build-time failure. A missing transformer means every class
is inert and the UI comes out unstyled. A missing token is a Vela diagnostic. Both are loud, both
happen on the next `rbxtsc`, and both are in front of the person who just ran the command.

A missing `PortalProvider` is not. Lattice reads the portal target from a strict context, so a
`dialog` without one compiles, type-checks, passes the playground build, ships — and throws the
first time a player clicks the button that opens it. The snippet would have been printed hundreds of
lines of package-manager output ago.

The other half of it: unlike a Vela config, there is exactly one correct edit, and it is two
insertions. An import, and a pair of tags around whatever the app already renders.

## What "a real parser" bought

`core/project/entry.ts` parses the entry with `@babel/parser`, and the rule that keeps it from
becoming the thing the roadmap warned about is this: **the parser is used for positions, never for
output.**

Re-printing a source file through any printer would normalize quotes, drop comment placement, and
re-indent JSX the consumer had arranged deliberately — a diff nobody asked for on a file they wrote.
So the AST answers *where* the last import ends and where the render call's argument starts, and the
edit itself is two string splices. Everything outside those two positions comes out byte for byte
identical, which is a property a test can assert and does.

The second rule: **anything ambiguous is reported, not guessed.**

| what the entry looks like | what happens |
| --- | --- |
| one `.render(` call, a `PlayerGui` expression somewhere | wrapped, after a prompt |
| two files under `src/` mount a tree | snippet, naming both |
| two `.render(` calls in the one entry | snippet — which tree to wrap is a design question |
| no `PlayerGui` named anywhere | snippet — synthesizing the lookup means editing imports too |
| provider already imported | nothing |

The `PlayerGui` case is the one worth explaining. Writing
`Players.LocalPlayer.WaitForChild("PlayerGui")` into the file also means adding `Players` to an
`@rbxts/services` import that may or may not exist, which is a second, riskier edit for a situation
that barely occurs — a client that mounts React always names its `PlayerGui`, because that is what
the root mounts into. So the CLI reuses the expression already there and stops when there is none.

## Which parser

Not `typescript`, which is the obvious reach and was the first answer here. roblox-ts depends on
`typescript` at an **exact** version (`=5.5.3` as of 3.0.0), so a caret range in this package does
not dedupe with it — it installs a second copy, and `typescript` unpacks to 23.6 MB. Pinning to
match roblox-ts instead would make Facet's parser choice a hostage to roblox-ts's upgrade schedule.

`@babel/parser` costs 5.1 MB across four packages, parses TSX under
`plugins: ["typescript", "jsx"]`, and hands back plain objects carrying `start`/`end` offsets —
which is the entire API surface this file needs. What it does not hand back is parent links or a
child iterator, so there is a short walker here that supplies both.

The parsers smaller than that — `meriyah`, `acorn` with `acorn-jsx` — have no TypeScript grammar,
and the first `as BasePlayerGui` in a roblox-ts entry ends the experiment. `oxc-parser` is faster
than any of them and ships a native binary per platform, which is a poor trade for a CLI that parses
one file per invocation.

The swap was safe to make because these tests assert the exact bytes of the rewritten file rather
than the shape of an AST: every one of them passed before and after, unchanged.

## Consent

The edit is behind a prompt that defaults to yes, and it is the last thing `add` does so nothing
scrolls past it. `--yes` writes it without asking. A non-interactive run **without** `--yes` prints
the snippet and writes nothing: stdin not being a terminal is not consent.

## Why the registry declares it

The alternative was for the CLI to know that `dialog` needs `PortalProvider`. That knowledge would
then live in a released binary, and the whole point of
[registry-hosting.md](registry-hosting.md) is that a component reaches users by being published to
the registry rather than by a CLI release — so the next layered component would need a CLI release
to be wired correctly.

`RegistryItem.providers` is what a component says about itself. It carries a name, the package to
import it from, and what each prop needs — `container: "player-gui"` rather than a string of source
text, because the expression for the local player's `PlayerGui` is knowledge about roblox-ts and
belongs in the tool reading the entry file, not in a string the registry hands over to be pasted
somewhere it cannot see.

## Why the format version did not move

`RegistryIndex.version` is 1 and stayed there. `loadIndex` *rejects* an index whose version it does
not recognise, so bumping it is what breaks every CLI already installed — to deliver a field those
CLIs would ignore anyway. An optional field is compatible in both directions: an older CLI does not
read `providers`, and a newer one reads `undefined` from an older registry. The number is for
removing a field, renaming one, or changing what an existing one means.
