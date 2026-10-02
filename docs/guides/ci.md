# CI

## Bridge in your pipeline

```yaml
- run: ackit-speckit sync
- run: ackit-speckit verify --profile standard
- run: ackit-speckit gate
```

`verify` exits 1 on FAIL; `gate` exits 1 on STALE/FAIL/NOT_VERIFIED, so plain
`run:` steps already gate the pipeline. Archive the bundle for audit:

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: verification-bundle
    path: .ackit-spec-kit/bundles/
```

## This repository's CI

- `ci.yml`: lint, format check, typecheck, build, unit/integration/security
  tests, CLI + package + extension smoke, on Windows + Ubuntu × Node 22/24.
- `security.yml`: `ackit scan --ci`, npm audit, CodeQL.
- `release.yml`: tag-triggered release with tarball, extension/workflow zips,
  SHA256SUMS, and smoke from the release artifact.
