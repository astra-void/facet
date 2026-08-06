# Provenance

**Status:** settled. Nothing is recorded at copy time. No `facet.lock`, no content hashes, no record
of which registry version a file came from. `facet add` writes the files and forgets.

## What a record would be for

`facet diff` wants to tell two things apart:

- the consumer edited this file — which is the whole point of the model, and not news
- upstream changed this component since it was copied — which is the only thing worth reporting

Without a record it can tell neither. It compares the file on disk against the registry as it stands
today, and both cases arrive as the same diff. `facet remove` has the same gap from the other side:
it refuses to delete a file that differs from the registry, using "differs" as a stand-in for "you
changed this", and that stand-in fires when only upstream moved.

A `facet.lock` of per-file content hashes is the obvious fix, and it was the plan.

## Why hashes do not actually fix it

A hash answers *whether* a file changed. It cannot show *how*, and "how" is the entire output of a
diff. Showing what a merge would involve needs the text the consumer started from — three-way, base
included — so the record that would satisfy `facet diff` is not a hash but a second copy of every
component, committed to the consumer's repository and kept in step with the first.

That is vendoring the registry into the project the CLI just copied out of it, to serve one command.

Even the yes/no is weaker than it looks. The hash goes stale for reasons that are not edits: a
project-wide formatter pass over `src/shared/ui`, a rename, a move to a different directory. Facet
then reports that the consumer changed everything — true, useless, and indistinguishable from the
report it would give if upstream had rewritten every component.

## Why it is worse here than in shadcn

shadcn does not record anything either, and the reason to hold that line is stronger in this repo.

The README's promise is that a copied file is yours: edit it, delete half of it, rename it. A lock
file is Facet keeping a ledger about files it gave away, and the ledger is a file the consumer
commits, never edits, and cannot read. The first time it disagrees with reality — and it will, see
above — it is a puzzle in their repository that Facet put there.

The registry is also unversioned today: `main` overwrites one live registry, so a hash from months
ago is being compared against a component that has moved for everyone. See
[registry-hosting.md](registry-hosting.md).

## What it obliges us to do

**Say what is not known, in the output, rather than implying otherwise.**

`facet diff` reports drift without attributing it. It must not phrase a diff as "upstream changed",
because it does not know that; the reasoning lives in
[commands/diff.ts](../../packages/tools/cli/src/commands/diff.ts).

`facet remove` errs toward the safe direction: it asks for `--force` on a file that differs, which
in the worst case means asking about a file the consumer never touched. Asking too often is
recoverable; deleting someone's edited component is not.

## Revisit if

The registry grows versions — per-release snapshots, or an `r/v1/` prefix, open in
[registry-hosting.md](registry-hosting.md).

That changes the shape of the problem rather than the answer to this one. With addressable
snapshots, the base text is something the CLI can *fetch* rather than something the consumer has to
store, and the only thing that needs recording is which snapshot was used — one field, in
`facet.json`, a file Facet already owns and the consumer already reads. Per-file provenance stays
unnecessary; the want behind it gets served by the registry instead.
