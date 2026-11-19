---
id: "TASK-0012"
title: "0.1.2 maintenance: current compatibility and release references"
status: active
schemaVersion: 2
dependencies:
  []
createdAt: "2026-10-02"
completedAt: null
---


## Purpose

Prepare a compatible 0.1.2 patch against current ACKit 0.5.5 and Spec Kit
1.4.2, correct current release references, and fix the confirmed Zod advisory.
Published bridge 0.1.1, ACKit 0.5.5 and Spec Kit 1.4.2 were read from their
registries/releases before planning. Historical release evidence stays intact.

## Scope

- Update current compatibility metadata/docs and CI tool pins; keep supported
  minima ACKit 0.5.0, Spec Kit 1.0.0 and Node 22 unchanged.
- Couple package/CLI/extension/workflow/current docs to source 0.1.2.
- Update only Zod to compatible patched 4.6.7 (locked 4.6.5 has confirmed high
  advisory GHSA-mrhx-c7xc-m3w5); review lockfile changes.
- Make registry absence checks fail closed on non-404 errors and allow a bounded
  30-minute npm processing wait with a 35-minute outer timeout; retain all gates.
- Validate real current CLIs, packaged CLI, native extension and freshness flow.
  Make the existing demo transcript version-specific so v0.1.0 evidence survives.

## Out of scope

- Breaking API/schema changes, raised compatibility minima, unrelated upgrades,
  new hosting/accounts, policy rewrites, historical version replacement.
- Publication is owned by dependent TASK-0015, after exact-head CI and merge.

## Affected files

- package.json, pnpm-lock.yaml, src/compat.ts, current README/docs/CHANGELOG.
- spec-kit extension/workflow metadata; CI/security/release tool pins and gates.
- Focused version/publish-gate contracts; versioned demo script/evidence.
- specs/002-maintenance-0-1-2/{spec,plan,tasks}.md; task progress/evidence.

## Required tests

- Frozen install; lint/format/typecheck/build; full unit/security/integration/E2E.
- Real ACKit 0.5.5 + private Spec Kit 1.4.2 doctor/demo; CLI/extension/package
  smokes; production audit; ACKit config/doctor/task/scan; text/diff checks.
- Actual built CLI/version metadata parity and fail-closed registry scenarios.

## Acceptance criteria

- [ ] Current references and coupled source versions are consistent; historical
  baselines and minimum-supported versions remain correct.
- [ ] Current real CLI lifecycle, package/extension smokes and full local gates pass.
- [ ] Production audit has no advisory; registry errors cannot authorize publish.
- [ ] Evidence and task/spec progress match executed results; TASK-0015 is ready.

## Test steps

1. Commit this complete plan and both dependent repository plans before code.
2. Run focused contracts and reproduce relevant stale-version/publish errors.
3. Implement the scoped maintenance; run all required local checks above.
4. Record exact outcomes, complete/archive this source-preparation task and
   continue TASK-0015's PR/CI/publication gates without a new permission request.

## Dependencies and authorization

The user authorizes updates on main, commits/pushes and the subsequent npm
patch publication through the existing process. Main stays the local working
branch; a temporary remote PR ref and a merge commit preserve the plan history.
TASK-0014 is scheduled pending because the current user prioritized maintenance;
its external documentation/account acceptance is not asserted or bypassed.

## Security and compatibility

No data migration, new credential/permission, runtime network or schema-ID change.
Retain argv/shell:false, path bounds, redaction, fresh-verdict completion rules.
Advisory source: https://github.com/advisories/GHSA-mrhx-c7xc-m3w5

## Risks

- Upstream CLI changes can expose compatibility defects; fix actual failures,
  never skip assertions or relabel an untested version as tested.
- npm processing may exceed the old six-minute window; preserve all identity,
  latest, checksum and fresh-consumer gates while allowing bounded propagation.

## Rollback plan

Before publication, a forward corrective commit/PR. After publication, only a
new patch may change artifacts; no tag move, force push or immutable overwrite.

## Completion notes

Planning checkpoint, before implementation. Baseline installed tools: ACKit
0.5.5, Spec Kit 1.0.13, Node 26.13.1, pnpm 11.22.0. Current Spec Kit 1.4.2
requires Python >=3.11 and will be installed only in a private test environment.
ACKit doctor/config/task doctor pass; existing scanner fixture findings are
covered by the existing policy. Production audit reports one high Zod advisory.
