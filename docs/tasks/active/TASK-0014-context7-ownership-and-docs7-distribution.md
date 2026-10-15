---
id: "TASK-0014"
title: "Context7 ownership-ready configuration and Docs7 documentation distribution"
status: active
schemaVersion: 2
dependencies: []
createdAt: "2026-10-15"
completedAt: null
---

## Purpose

Make the existing public ACKit Spec Kit Bridge documentation Context7-owner-ready and Docs7-hostable without modifying the deterministic bridge lifecycle, existing GitHub Pages hosting or published release.

## Scope

- Add `context7.json` with schema-accurate metadata and curated documentation scope, with no invented claim public key.
- Add `docs/docs.json` and `docs/index.mdx` for a standalone Docs7 website based on maintained source pages.
- Document owner-only Context7 claim and verification, Docs7 Free setup, automatic refresh, and verification steps.
- Add narrow README/CHANGELOG discoverability notes as warranted.
- Coordinate a subsequent patch-release decision with ACKit repository maintenance without bundling runtime changes.

## Out of scope

- Changing offline-first bridge runtime, release automation, Spec Kit extension behavior, task digests or tests.
- Publishing new npm package/tag/GitHub Release before full test/ownership/Docs7 production evidence.
- Replacing or disabling GitHub Pages.
- Committing tokens or a fabricated Context7 `public_key`.

## Affected files

- `context7.json`
- `docs/docs.json`, `docs/index.mdx`, `docs/guides/context7-docs7.md`
- `README.md`, `CHANGELOG.md` (minimal links/notes)

## Acceptance criteria

- [ ] Context7 config valid against official schema and indexes current product docs, not archived tasks.
- [ ] Docs7 navigation references existing docs and valid MDX introduction.
- [ ] Owner claim + verification and Docs7 Free connection steps documented, including limitations.
- [ ] No runtime/ABI/release-workflow changes and no premature release/version bump.
- [ ] Static JSON/link checks plus full relevant repo quality gates and PR CI pass.
- [ ] Docs7 production build, Context7 refresh, ownership and verification evidence collected before closing.

## Test steps

1. Parse JSON files; check Docs7 navigation routes on disk and API descriptors.
2. Run text hygiene, `git diff --check`, `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm build`, `pnpm test`, smoke CLI/extension/package, ACKit scan gates.
3. Confirm PR exact-head CI.
4. Owner inserts their dashboard-provided Context7 claim key, claims and applies for verification.
5. Owner connects Docs7 GitHub source to `main` with `docs` path; verify builds and `llms.txt`, agent-readable `.md` pages.

## Security considerations

- Never store Context7 API tokens. Claim `public_key` is a public challenge issued uniquely to the library.
- Docs7 connection is an explicit account operation; new docs cannot send data through the installed CLI.
- Existing offline-first, deterministic safeguards stay intact.

## Risks

- External claim/verification and Docs7 build are unavailable via the connected Context7 read-only tools.
- Existing Docs7 site configuration requires a successful GitHub-authenticated owner action.

## Rollback plan

Revert only newly-added docs/config files; published 0.1.1 is immutable.

## Completion notes

PENDING. GitHub connector has no repository CLI execution; direct checkout failed DNS resolution to github.com and pnpm is unavailable in the container. `TASK-0014` was manually allocated after checked `TASK-0013` and is explicitly the fallback from `ackit task create`. No local or hosted release checks can be claimed.
