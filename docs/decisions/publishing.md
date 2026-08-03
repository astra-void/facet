# Publishing

**Status:** decided. npm OIDC trusted publishing from GitHub Actions. No `NPM_TOKEN`, no OTP.

## Why not a token

The account has 2FA set to `auth-and-writes`, so every publish needs a one-time password — fine by
hand, impossible in CI. The usual answer is an automation token, which bypasses 2FA precisely because
it is a long-lived secret sitting in repository settings: exactly the thing supply-chain attacks go
looking for.

Trusted publishing removes the secret. npm exchanges the workflow's short-lived OIDC token for
publish rights scoped to one package, one repository, one workflow file. Nothing to leak, nothing to
rotate. Provenance attestations are generated automatically.

## Why `pnpm publish` and not `npm publish`

`facet-rbxts` depends on `@facet-ui/theme` through `workspace:*`. npm does not understand the
workspace protocol and would publish that string verbatim, producing a package nobody can install —
which is a mistake this repo has already made once, in the other direction, by publishing the CLI
before its dependencies existed.

pnpm rewrites the protocol to a concrete version at pack time *and* implements the OIDC exchange
itself, so it covers both requirements. It has to be pnpm **11.6 or newer**: OIDC publishing was
broken in early 11.x (pnpm/pnpm#11513) and fixed by pnpm/pnpm#11526. The pinned version lives in
`packageManager`, and `pnpm/action-setup` reads it from there.

## One-time setup on npmjs.com

Per package — `@facet-ui/react-variants`, `@facet-ui/theme`, `facet-rbxts` — under Settings →
Trusted publisher:

| Field | Value |
| --- | --- |
| Publisher | GitHub Actions |
| Organization or user | `astra-void` |
| Repository | `facet` |
| Workflow filename | `publish.yml` |
| Environment | leave empty |
| Allowed actions | tick **npm publish** |

The last row only exists for configurations created after 2026-05-20, and at least one action must
be selected or the config saves without granting anything.

Environment is left empty deliberately: an environment name in the npm config must be matched by an
`environment:` key in the workflow, and a mismatch fails at publish time with an error that reads
like an auth problem. Add one on both sides later if release approvals are wanted.

A package must already exist before a trusted publisher can be configured for it, so the first
publish of any *new* package is still manual.

## Releasing

1. `pnpm changeset:add` and describe the change
2. `pnpm changeset:version` — the `fixed` group in `.changeset/config.json` moves all three packages
   together, so their versions never diverge
3. commit, tag `vX.Y.Z`, push the tag

The tag push runs `.github/workflows/publish.yml`, which gates on `pnpm run check` before publishing.
`workflow_dispatch` does the same thing without a tag.

`pnpm -r publish` skips any package whose version is already on the registry, so a re-run after a
partial failure republishes only what is missing.
