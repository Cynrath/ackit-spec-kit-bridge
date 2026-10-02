---
id: "TASK-0013"
title: "Bridge 0.1.1 public-surface and release hardening"
status: active
schemaVersion: 2
dependencies: []
createdAt: "2026-10-02"
completedAt: null
---

## Purpose

Bring the bridge public surface (README, npm metadata, docs) to ACKit
quality, harden release.yml for OIDC Trusted Publishing with no manual npm
approval, and publish exactly 0.1.1 / v0.1.1 so the npm page renders the
new README.

## Scope

- README.md rewrite (badges, demo, Why table, feature inventory, Mermaid,
  all required sections); stale npm-pending text removed.
- package.json: version 0.1.1, homepage → hosted bridge docs,
  exports["."].types → ./dist/index.d.ts.
- src/compat.ts BRIDGE_VERSION 0.1.1; extension.yml + workflow.yml 0.1.1.
- New docs: guides/trust-flow-demo.md, guides/release.md,
  concepts/spec-kit-and-ackit.md, concepts/verification-freshness.md.
- Version-parity edits: compatibility.md, schemas.md, state-digest.md,
  configuration.md, spec-kit-extension.md.
- scripts/package-smoke.mjs: version-dynamic assertion + exact-version
  tarball preference.
- release.yml hardening: exact vX.Y.Z trigger, concurrency, identity
  validation, full quality gate, exact-tarball audit, version-absence gate,
  OIDC npm publish --provenance, registry/fresh-consumer verification,
  GitHub Release after npm verification, asset SHA-256 check.
- CHANGELOG.md 0.1.1 section.

## Out of scope

- Spec Kit upstream changes; ACKit core changes (separate repo task).
- Staged-publish default (documented as optional only).
- New runtime features or CLI contract changes.

## Affected files

- README.md, CHANGELOG.md, package.json, src/compat.ts
- spec-kit/extension/extension.yml, spec-kit/workflow/workflow.yml
- docs/guides/trust-flow-demo.md, docs/guides/release.md
- docs/concepts/spec-kit-and-ackit.md, docs/concepts/verification-freshness.md
- docs/reference/compatibility.md, docs/reference/schemas.md
- docs/architecture/state-digest.md, docs/reference/configuration.md
- docs/guides/spec-kit-extension.md, scripts/package-smoke.mjs
- .github/workflows/release.yml

## Required tests

- pnpm lint, format:check, typecheck, build, test (43 tests), smoke:cli,
  smoke:extension, smoke:package, npm pack --dry-run audit
- ackit config check, policy check, scan --ci, readiness
- Post-tag: release workflow green, npm 0.1.1 + latest, fresh consumer,
  GitHub Release assets

## Acceptance criteria

- [x] README meets quality spec; stale pending text gone
- [x] package.json metadata correct; tarball clean (no dist/src dup)
- [x] release.yml OIDC direct-publish, no tokens, version-absence gate
- [x] local suite green (43/43) + smokes + ACKit gates
- [ ] PR merged to main with green CI
- [ ] v0.1.1 tag → release green → npm 0.1.1 latest → GitHub Release

## Test steps

1. `pnpm lint && pnpm format:check && pnpm typecheck && pnpm build` — pass
2. `pnpm test` — 43/43 pass (unit 28+8, e2e trust-flow, integration x2)
3. `pnpm smoke:cli && pnpm smoke:extension && pnpm smoke:package` — pass
4. `npm pack --dry-run --json` — README/CHANGELOG/LICENSE/dist/schemas/spec-kit present; no leaks
5. `ackit config check / policy check / scan --ci / readiness` — pass
6. Post-merge/tag: watch release.yml run green; verify registry + consumer

## Risks

- Tag/package mismatch fails release closed (by design; verify before tag).
- npm Trusted Publisher entry missing → publish step fails closed with
  OIDC 403; one-time setup documented in docs/guides/release.md.
- If 0.1.1/version tag unexpectedly exists: STOP, report blocker, never
  auto-bump.

## Rollback plan

Focused commit revert before tag. After tag: never move tag/version; fix
forward with a new patch only if needed.

## Completion notes

Implementation done locally; evidence pending PR/CI/tag/release verification.
