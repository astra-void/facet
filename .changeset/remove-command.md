---
"facet-rbxts": minor
---

`facet remove` is implemented.

It deletes the files a component was copied as, and refuses in the two cases where deleting would
be someone else's problem: a file whose contents differ from the registry, and a file another
installed component still imports.

`--force` covers the first — a difference means "you edited this" or "upstream moved", nothing
recorded at copy time can say which, and the output says so rather than picking one. It does not
cover the second: deleting `utils` out from under an installed `button` leaves a project that does
not compile, and the request was to remove one component, not to break another. That check runs to
a fixed point, so a dependency stays when the thing importing it turns out to be staying too.
