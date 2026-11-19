---
id: "TASK-0015"
title: "Publish the verified bridge 0.1.2 maintenance patch"
status: pending
schemaVersion: 2
dependencies:
  - "TASK-0012"
createdAt: "2026-11-19"
completedAt: null
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

- [ ] Source preparation integrated on main after successful exact-head CI.
- [ ] New immutable tag and npm 0.1.2/latest publication verified.
- [ ] Fresh installed CLI/SDK and release/archive checksums pass independently.
- [ ] Task evidence, temporary refs and final main/remote state are truthful.

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

Tool-allocated plan only. Published stable was independently read as 0.1.1;
0.1.2 is the proposed compatible patch. No new tag or publication has occurred.

Dependencies: TASK-0012
