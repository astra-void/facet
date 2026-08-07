# Registry versioning

**Status:** settled. Every push to main publishes an immutable `r/<sha>/` beside the moving `r/`. A
project pins one by pointing `registry` in its `facet.json` at it. The CLI did not change, and
neither did the registry format.

## The problem

`r/` is one live registry that main overwrites. That is right for `facet add`, which should hand
someone the current component — but it means a project that ran `add` months ago is being compared
against something that has moved for everyone, and `facet diff` reports drift it cannot attribute
(see [provenance.md](provenance.md)). There was no way to say "the registry I built against".

## What a revision is

The whole registry, written a second time under the commit that produced it:

```
r/index.json          the moving registry every released CLI reads by default
r/button.json
r/a1b2c3d/index.json  the same bytes, frozen, forever
r/a1b2c3d/button.json
```

Byte for byte identical, not a rendering — `add` from a pin has to produce what `add` produced at
the time, and a test asserts the copies match.

The commit SHA is the key because it is the only identifier that is already immutable, already
unique per publish, and already meaningful outside this file. A CLI version would not do: three
components shipped under `0.3.0` on separate pushes, because a component reaches users by being
published to the registry rather than by a CLI release.

`revisions.json` at the site root lists what exists, newest first, and which revision `r/` currently
mirrors. It is rebuilt by scanning the published tree, so it cannot claim a revision that is not
there.

## Pinning is a field that already existed

`facet.json` has carried a `registry` field since `init` first wrote one, for forks and private
registries. A pin is that field:

```json
{ "registry": "https://facet.astra-void.xyz/r/a1b2c3d" }
```

Every command reads it — `add` copies from that revision, `diff` compares against it, `doctor`
checks it, and all three print which registry they used. No new field, no new flag, no format
change, and every already-released CLI can pin today.

This is the whole reason the versioning scheme is shaped this way. The alternative — recording a
revision per component so `diff` could attribute a change — is a bigger idea that reopens
[provenance.md](provenance.md), and it stays available: revisions are what would make it possible,
and nothing here forecloses it.

## Why the site is a branch now

Pages deploys one artifact and the artifact replaces the entire site, so a revision written by one
deploy would be deleted by the next. The published tree therefore lives on `gh-pages` and
accumulates: the workflow checks it out, copies the new build over it, commits, and uploads *that*
tree as the artifact.

The branch is storage, not a deployment source — Pages is still deployed from Actions, and
`.git` is removed before the upload so the accumulator's history is not part of the site.

`site/` is still generated and still not committed to main. What is committed to `gh-pages` is a
build output nobody edits, which is the same rule seen from the other side: the published registry
cannot drift from `registry/`, because every deploy rewrites `r/` from it.

## What it obliges

**A revision is forever.** Deleting one breaks any project pinned to it, and unlike a bad npm
release there is no version to move past. Publishing a broken registry is already guarded by
`registry:check` before the build; this raises the cost of getting it wrong from "fix it on the next
push" to "fix it on the next push, and the bad revision stays".

**The branch grows.** Each revision is the whole registry — around 200KB at ten components — and
duplicated per push. That is fine for a long time and not forever; when it stops being fine, the
answer is to stop writing a revision per push and start writing one per registry *change*, which is
a build-time decision this scheme can take later without moving anything.

## Revisit if

The branch gets big enough to slow the deploy, or a project wants to pin something coarser than a
commit — a release line rather than a point. Both are addressed by choosing revisions more
selectively, not by changing what a pinned revision is.
