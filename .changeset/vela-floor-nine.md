---
"facet-rbxts": patch
---

`facet init` now installs `vela-rbxts@^0.9.0`.

It installed `^0.7.0`, two minors below what the published registry needs, so a project set up
from scratch got a Vela that could not build the components the CLI had just copied into it:
`opacity-*`, `whitespace-*` and `leading-*` reach the class path only from 0.8.0, and `card` does
not compile at all below 0.9.0 — 0.8.0 inlined its runtime into every emitted file and ran the
Luau local-register budget dry, so `card` failed at its second part with `Out of local registers`
pointing at generated code the author never wrote.

The floor and the reasoning behind it now live in `core/requirements.ts`, which `facet doctor`
reads too, so the version `init` installs and the version `doctor` checks cannot drift apart.
