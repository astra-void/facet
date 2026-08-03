# Registry hosting

**Status:** decided. The registry is a static site on GitHub Pages at `facet.astra-void.xyz`,
fetched by the CLI at runtime.

## Shape

`pnpm registry:build` turns `registry/` into a `site/` directory:

```
site/
  .nojekyll         Pages runs Jekyll otherwise, which eats underscore-prefixed paths
  CNAME             facet.astra-void.xyz
  index.html        landing page listing what exists
  r/index.json      the index the CLI reads first
  r/<name>.json     one payload per component, source text inlined
```

The `CNAME` file is generated rather than committed because deploying from an Actions artifact
replaces the entire site. Without it in the artifact, GitHub can revert the custom domain to the
`github.io` default — and every released CLI has `https://facet.astra-void.xyz/r` baked in as its
default, so that outage is not something a patch release fixes quickly.

DNS side, one-time: a `CNAME` record for `facet` pointing at `astra-void.github.io`.

`.github/workflows/pages.yml` rebuilds and deploys it on every push to `main`, gated behind
`registry:check`. Nothing under `site/` is committed, so the published registry cannot drift from
`registry/`.

## Fetched, not bundled

The CLI was originally going to ship the registry inside the npm package. Hosting changes that, and
the fetched model is the better one:

- Adding a component no longer requires a CLI release.
- `facet add button` produces the same files for everyone, rather than whatever was frozen into the
  CLI version they happen to have installed.

The cost is that `add` needs a network. That is the same trade shadcn/ui makes, and the failure is
loud and obvious rather than silent and stale.

## Overriding

Resolution order, most specific first — see `core/registry/source.ts`:

1. `FACET_REGISTRY_DIR` — a local directory. How this repo tests the CLI against the working tree.
2. `--registry <url|path>`, or `registry` in `facet.json` — forks, private registries, version pins.
3. `FACET_REGISTRY_URL`
4. The default published URL.

## The host is named in three places

`DEFAULT_REGISTRY_URL` in `core/registry/source.ts`, `$schema` in `core/config.ts`, and
`CUSTOM_DOMAIN` in `scripts/build-registry.ts`. They must agree; a mismatch between the last one and
the first two means the CLI asks a host the site no longer claims.

## Open

- **Versioning.** Right now `main` overwrites one live registry, so an edit to a component reaches
  everyone immediately, including projects that ran `facet add` months ago and will next run
  `facet diff`. A `r/v1/` prefix, or per-release snapshots, is the obvious hedge. Decide alongside
  `facet diff`, which is the command that makes drift visible.
- **`schema.json`.** `facet.json` advertises one at the site root; it is not generated yet.
