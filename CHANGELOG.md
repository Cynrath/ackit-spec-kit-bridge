# Changelog

All notable changes to `@cynrath/ackit-spec-kit-bridge` are documented here.
This project follows Semantic Versioning.

## [0.1.1] - 2026-10-02

Public-surface and release-automation hardening. No behavior change to the
verified lifecycle, digest, gate, or CLI contract.

### Added

- Rewritten `README.md` to ACKit-quality presentation: badges, 60-second
  demo, stale-verdict demo, Before/With-Bridge table, full feature
  inventory, Mermaid architecture with Spec Kit/ACKit ownership, and
  complete section coverage (Why through License).
- New guides: `docs/guides/trust-flow-demo.md` (verify → mutate → STALE →
  re-verify walkthrough) and `docs/guides/release.md` (tag → OIDC publish
  → verify → GitHub Release, plus one-time Trusted Publisher setup).
- New concepts: `docs/concepts/spec-kit-and-ackit.md` (ownership
  boundaries) and `docs/concepts/verification-freshness.md` (subject +
  evidence digests, freshness comparison, `stalePolicy: fail`).
- Hosted documentation surface at
  `https://cynrath.github.io/ackit-spec-kit-bridge/` (generated from this
  repo's `docs/`, `README.md`, and `package.json`).
- Hardened `release.yml`: exact `vX.Y.Z` tag validation, tag/package
  parity, frozen install, lint/format/typecheck/build, unit tests, all
  three smoke suites, ACKit gates, single exact-tarball audit, npm
  version-absence gate, OIDC `npm publish --provenance` (no tokens),
  registry/shasum/fresh-consumer verification, GitHub Release only after
  npm verification.

### Fixed

- Removed stale "npm publication pending / install from tarball" note;
  install is now the normal `npm install --global`
  `@cynrath/ackit-spec-kit-bridge` (plus pinned variant).
- `package.json` `exports["."].types` now points to `./dist/index.d.ts`
  (was `./dist/index.js`); `homepage` points to the hosted bridge docs.
- `spec-kit/extension/extension.yml` version parity (`0.1.1`) and homepage
  points to the hosted bridge docs.

### Compatibility

- Tested against ACKit 0.5.4 and Spec Kit specify 1.0.13 on Windows
  (Node 24.13.0, pnpm 11.22.0); Ubuntu in CI.

## [0.1.0] - 2026-10-02

First public release: community integration for ACKit and GitHub Spec Kit.

### Added

- `ackit-speckit` CLI with `init`, `doctor`, `sync`, `status`, `verify`,
  `gate`, `checkpoint`, `handoff`, `complete`, `explain`, `version`;
  stable exit codes (0/1/2/3/4/5) and `--json` contracts.
- State-bound verification: canonical `subjectDigest` + `evidenceDigest`,
  PASS/FAIL verdicts, STALE on any subject change, read-only gate, safe
  completion via ACKit's own task lifecycle.
- Deterministic lifecycle: UNINITIALIZED → READY → SPECIFIED → PLANNED →
  TASKED → IMPLEMENTING → VERIFIED → COMPLETE, plus STALE/BLOCKED.
- Native Spec Kit extension (`spec-kit/extension`, id `ackit`) with 7
  `speckit.ackit.*` commands and sync/status/verify hooks; `ackit-verified-sdd`
  workflow package (`spec-kit/workflow`).
- JSON schemas for config, status, verification bundle, verdict, checkpoint,
  handoff; redacted evidence; offline-first, no telemetry.
- Tests: unit, integration (real temp Git/ACKit/Spec Kit repos), freshness
  mutation, security (traversal/injection/redaction/unicode/spaces), E2E,
  package + extension smoke.
- Docs: architecture (overview/lifecycle/state-digest/security), guides,
  CLI/config/schema/lifecycle/compatibility references, 3 ADRs.
- CI: `ci.yml` (Windows + Ubuntu), `security.yml`, `dependency-review.yml`,
  `release.yml` with npm tarball + extension/workflow archives + SHA256SUMS.

### Compatibility

- Tested against ACKit 0.5.4 and Spec Kit specify 1.0.13 on Windows
  (Node 24.13.0, pnpm 11.22.0); Ubuntu in CI.
