---
"facet-rbxts": patch
---

`facet list` reads the registry the project configured.

It was the one command that never opened `facet.json`, so a project pointing `registry` at a fork,
a private registry, or a pinned revision was still listed the default one — offering components a
`facet add` in that project could not fetch.

It still works outside a project, which is what it is for: a missing or unreadable `facet.json` is
an ordinary outcome there, not an error.
