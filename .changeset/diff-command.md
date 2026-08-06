---
"facet-rbxts": minor
---

`facet diff` is implemented. With it, every command the CLI advertises is written.

It compares copied components against the registry as it stands today, replaying the `~/` rewrite
first so the alias and directory choices of a project are not reported as changes. `-` is the
registry, `+` is your file, so applying the `+` side is what "keep mine" means.

What it will not do is say which side moved. Nothing is recorded at copy time, so a difference is
an edit, a change upstream, or both, and the output says that instead of picking one.

The diff itself is an LCS over lines in `core/unifiedDiff.ts` rather than a dependency — the files
are a few hundred lines and the CLI still ships with one runtime dependency.
