# Release guide

Normal releases are tag-driven and fully automated. No manual npm approval,
no long-lived npm token, no `NPM_TOKEN`.

## Normal mode (default)

```text
maintainer pushes vX.Y.Z
  → GitHub Actions release.yml (ubuntu-latest)
  → permissions: contents: write, id-token: write
  → npm OIDC Trusted Publisher
  → npm publish <exact-tarball> --access public --provenance
  → registry / shasum / dist-tags / fresh-consumer verification
  → GitHub Release (exact tarball + extension/workflow archives + SHA256SUMS)
```

### Prerequisites (one-time)

The npm Trusted Publisher entry must allow **direct `npm publish`** from:

- GitHub user: `Cynrath`
- Repository: `ackit-spec-kit-bridge`
- Workflow file: `release.yml`
- Allowed action: `npm publish`

If the entry does not exist yet, check current CLI support first:

```powershell
npm trust github --help
```

then create the equivalent of (verify exact flags against `--help`):

```powershell
npm trust github '@cynrath/ackit-spec-kit-bridge' `
  --repo Cynrath/ackit-spec-kit-bridge `
  --file release.yml `
  --allow-publish
```

Creating or changing the Trusted Publisher entry may require a one-time
interactive WebAuthn/security-key proof-of-presence in the npm web UI. That
is account configuration, not per-release approval — routine releases after
that need no human gating.

After Trusted Publishing works, set the package's publishing security to the
strongest compatible setting ("require 2FA and disallow traditional
tokens" or its current equivalent) via the one-time npm UI action. Never
disable the Trusted Publisher and never store a write token to avoid it.

### Cutting a release

1. Land all changes on `main` with green CI.
2. Set `package.json` version, `src/compat.ts` `BRIDGE_VERSION`,
   `spec-kit/extension/extension.yml` version, and a `CHANGELOG.md` section
   to the exact release version.
3. Push the release commit; wait for CI green.
4. Prove readiness: `package.json` version == tag version, `CHANGELOG` has
   the version, `npm view @cynrath/ackit-spec-kit-bridge@X.Y.Z` is E404,
   remote tag `vX.Y.Z` is absent, working tree is the verified commit.
5. Push exactly tag `vX.Y.Z`. The workflow does the rest.
6. Verify: `npm view` latest/dist-tags/shasum, fresh isolated install,
   `ackit-speckit --version` / `--help`, GitHub Release assets + SHA-256.

Rules: never republish or mutate a published version; never move a tag; if
the version or tag unexpectedly exists, stop and report instead of picking
another version automatically.

## Optional staged mode (maximum assurance, not default)

`npm stage publish` → maintainer review → `npm stage approve` (with
2FA/security-key proof-of-presence) exists for publishes that explicitly
want human gating on every release. It is documented here for completeness;
do not use it as the normal path — it requires manual approval every time
by design.

## What the workflow checks

Exact `vX.Y.Z` tag shape; tag commit == checkout; `package.json` version ==
tag; package name identity; `repository.url` matches
`Cynrath/ackit-spec-kit-bridge`; npm CLI >= 11.5.1 (Trusted Publishing).
Then frozen install, lint, format check, typecheck, build, tests, all three
smokes, ACKit gates (`config check`, `policy check`, `scan --ci`,
`readiness`, `skills validate`), single exact-tarball audit (no
`dist/src` duplicate, no stale pending-publication text), npm
version-absence gate (E404 = safe; existing version = fail), OIDC publish,
registry verification with bounded retries, fresh consumer install, and only
then the GitHub Release.
