---
id: "TASK-0015"
title: "Publish the verified bridge 0.1.2 maintenance patch"
status: completed
schemaVersion: 2
dependencies:
  - "TASK-0012"
createdAt: "2026-11-19"
completedAt: 2026-11-19
---


## Purpose

Publish and independently verify bridge 0.1.2 through the existing tag-driven
OIDC workflow, then provide the actual stable source for the website refresh.

## Scope

- Integrate TASK-0012 on main through a green-CI PR; preserve the plan commits.
- Verify main/ref/version parity and registry/tag absence, create/push a NEW
  annotated v0.1.2 tag, observe the automatic release run without dispatch.
- Verify npm latest, fresh isolated CLI/SDK consumers, provenance and registry
  checksum; GitHub Release tarball/extension/workflow/SHA256SUMS identity.
- Complete the normal task archive record after evidence; keep main clean and
  remove temporary PR refs. Website task consumes published versions afterward.

## Explicit user authorization (2026-11-19)

The current goal authorizes scoped changes, commits and pushes on main. The
subsequent user request explicitly adds npm publication through the same
controlled process used for ACKit. This task records authorization for scoped
PR integration, NEW v0.1.2 tag creation/push, automatic npm OIDC publication and
workflow-created GitHub Release/assets. Existing publisher configuration is
used. No secret/permission/account, forced Git, tag movement, package overwrite,
manual deployment or workflow dispatch is authorized by this task.

## Out of scope

- Marketplace/VS Code publication (this package is a Spec Kit integration),
  global tool replacement, unrelated repositories, historical release mutation.

## Affected files

- Task/spec evidence, release notes; ignored tarballs/ZIP/checksum/consumer logs.
- No product code after TASK-0012 except a necessary reviewed corrective change.

## Required tests

- Exact-head CI before merge; main/tag/version/absence checks; automatic release
  gates; fresh outside-checkout npm install/npx/SDK; downloaded checksum proofs.

## Acceptance criteria

- [x] Source preparation integrated on main after successful exact-head CI.
- [x] New immutable tag and npm 0.1.2/latest publication verified.
- [x] Fresh installed CLI/SDK and release/archive checksums pass independently.
- [x] Task evidence, temporary refs and final main/remote state are truthful.

## Test steps

1. Inspect source-preparation evidence and PR CI; merge normally and update main.
2. Confirm version/tag identity and exact target absence immediately before tag.
3. Push only the new annotated tag; observe the existing release workflow.
4. If publication partially succeeds, preserve the tag/package and verify state
   before any downstream repair; never blindly republish or rerun Release.
5. Independently verify public metadata, fresh consumers and downloaded assets;
   record/archive through the normal procedure. Confirm both main refs match.

## Security and compatibility

OIDC/provenance and existing fail-closed quality/security/identity gates remain.
No credentials in files/logs, runtime network, production data or migrations.

## Risks

- Registry processing and existing Trusted Publisher availability are external.
  Missing authentication is a real blocker; never create a write token workaround.
- A release failure after upload requires read-back and forward repair, not
  mutable tags or republishing an existing version.

## Rollback plan

Forward correction before publication; after publication only a new patch.
Never move/delete the tag or overwrite registry/GitHub artifacts.

## Completion notes

All publication acceptance criteria are verified. This archive record uses the
normal reviewed integration flow and changes no published artifact or runtime.

- PR #36 exact head 1561691339f23e5a7ad0ec2f524030f95bbbbf70 passed 11/11
  checks, including Windows/Ubuntu Node 22/24 quality, real E2E, full audit,
  CodeQL, ACKit latest and Docs7 Preview. Merge a7c3f8814599c16a4bb05d76648bdbfab711047f
  preserves the plan commits and has the identical verified tree. Main CI
  44493130979 and Security 44493130731 also concluded success on that merge.
- Registry 0.1.2 returned 404 and the local/remote tag were absent immediately
  before cutting the NEW annotated v0.1.2. Tag object
  df858c47b7798c023588a964860e3ff6450aa7d9 peels to the verified main merge.
  The tag was not moved, replaced or repushed with different contents.
- Automatic Release run 44493452919 concluded SUCCESS. Existing OIDC/provenance
  publisher authentication worked without a token/account/permission change.
  Actual release inputs are ACKit 0.5.5 and specify 1.4.2; CI installs latest,
  and release notes derive those values from the installed tools, not fixed pins.
- npm version and latest both 0.1.2. Fresh outside-checkout npx and installed
  CLI returned 0.1.2. Public SDK imported successfully; current compatibility
  passed, below-minimum ACKit refused, unchanged minima verified. Unique caches
  and private consumer directories avoided global/local-self-package mutation.
  npm audit signatures verified 4 signatures and 2 attestations.
- Public GitHub Release v0.1.2 contains exact tarball, native extension ZIP,
  workflow ZIP and SHA256SUMS. All 3 listed SHA-256 entries match downloads;
  both ZIP manifests report 0.1.2. Registry and release tarball SHA-1 agree:
  a32166aaffb7dbb64bc3d03b2c836b44480e45c9. SHA-512 integrity also agrees with
  registry metadata; provenance predicate is SLSA v1.
- Website handoff fulfilled: PR #17 integrated on its main at 61b3b6c;
  docs-integrity and existing Pages automation succeeded. Six public routes
  returned 200 with ACKit 0.5.5/bridge 0.1.2, current compatibility/discovery;
  public sitemap retains 49 URLs. Website TASK-0001 owns its archive record.
- Temporary source PR ref was deleted; bridge main equals origin/main, clean.
  Historical versions/evidence are untouched. TASK-0014 remains pending with
  its separate documentation/account acceptance; it is not falsely completed.

### Initial allocation checkpoint (historical)

Tool-allocated plan only. Published stable was independently read as 0.1.1;
0.1.2 is the proposed compatible patch. No new tag or publication has occurred.

Dependencies: TASK-0012
