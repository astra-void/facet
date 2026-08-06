---
"facet-rbxts": minor
---

`facet doctor` is implemented.

It reports what a project has against what the components it copied actually assume: the
`facet.json` aliases and whether an `import` specifier has a tsconfig `paths` entry behind it,
whether `vela-rbxts/transformer` is registered, whether the Vela config supplies every semantic
token the installed components name, and whether the packages under them meet their version
floors — the last being the check that catches a project set up by an older CLI, where the copied
files are current and the Vela beneath them is two minors behind.

Checks that can be answered locally are answered even when the registry cannot be reached; the
rest are reported as skipped. Anything failing exits non-zero, so it is usable in CI.
