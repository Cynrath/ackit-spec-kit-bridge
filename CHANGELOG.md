# Changelog

All notable changes to `@cynrath/ackit-spec-kit-bridge` are documented here.
This project follows Semantic Versioning.

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
