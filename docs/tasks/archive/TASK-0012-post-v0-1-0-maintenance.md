---
id: "TASK-0012"
title: "0.1.2 maintenance: current compatibility and release references"
status: completed
schemaVersion: 2
dependencies:
  []
createdAt: "2026-10-02"
completedAt: 2026-11-19
---


## Purpose

Prepare a compatible 0.1.2 patch against current ACKit 0.5.5 and Spec Kit
1.4.2, correct current release references, and fix the confirmed Zod advisory.
Published bridge 0.1.1, ACKit 0.5.5 and Spec Kit 1.4.2 were read from their
registries/releases before planning. Historical release evidence stays intact.

## Scope

- Update current compatibility metadata/docs and CI's latest-upstream policy; keep supported
  minima ACKit 0.5.0, Spec Kit 1.0.0 and Node 22 unchanged.
- Couple package/CLI/extension/workflow/current docs to source 0.1.2.
- Update only Zod to compatible patched 4.6.7 (locked 4.6.5 has confirmed high
  advisory GHSA-mrhx-c7xc-m3w5); review lockfile changes.
- Clear the existing mandatory full-audit CI gate with compatible Vitest
  4.1.12 and patched Vite 8.3.3 transitive resolution. The current dev chain has
  8 advisories (1 high, 6 moderate, 1 low); keep the audit threshold unchanged.
  Vite is an explicit development peer provider because pnpm retained vulnerable
  auto-peer 8.3.1 even after the targeted transitive refresh. No runtime dependency
  or global tool is added; ^8.3.3 satisfies Vitest's declared peer range.
- Make registry absence checks fail closed on non-404 errors and allow a bounded
  30-minute npm processing wait with a 35-minute outer timeout; retain all gates.
- Validate real current CLIs, packaged CLI, native extension and freshness flow.
  Make the existing demo transcript version-specific so v0.1.0 evidence survives.
- Correct the observed doctor host-path disclosure with portable root/config
  labels in human/JSON output; preserve the doctor schema and environment exits.

## Out of scope

- Breaking API/schema changes, raised compatibility minima, unrelated upgrades,
  new hosting/accounts, policy rewrites, historical version replacement.
- Publication is owned by dependent TASK-0015, after exact-head CI and merge.

## Affected files

- package.json, pnpm-lock.yaml, src/compat.ts, current README/docs/CHANGELOG.
- spec-kit extension/workflow metadata; CI/security/release tool pins and gates.
- Focused version/publish-gate contracts; versioned demo script/evidence.
- src/cli/index.ts doctor presentation and its real executable regression check.
- specs/002-maintenance-0-1-2/{spec,plan,tasks}.md; task progress/evidence.

## Required tests

- Frozen install; lint/format/typecheck/build; full unit/security/integration/E2E.
- Real ACKit 0.5.5 + private Spec Kit 1.4.2 doctor/demo; CLI/extension/package
  smokes; production audit; ACKit config/doctor/task/scan; text/diff checks.
- Actual built CLI/version metadata parity and fail-closed registry scenarios.

## Acceptance criteria

- [x] Current references and coupled source versions are consistent; historical
  baselines and minimum-supported versions remain correct.
- [x] Current real CLI lifecycle, package/extension smokes and full local gates pass.
- [x] Production audit has no advisory; registry errors cannot authorize publish.
- [x] Existing full dependency-audit CI gate passes after compatible dev patches.
- [x] Doctor output preserves its schema while exposing no machine root/config path.
- [x] Evidence and task/spec progress match executed results; TASK-0015 is ready.

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

The user explicitly requested that CI use the latest ACKit instead of pinning
0.5.5. ACKit installs/checks therefore use @latest and Spec Kit installs also
follow latest. Tested-version metadata describes observed validation snapshots,
not CI constraints; release notes record the tools actually installed in the run.

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

Source preparation is verified; hosted CI/main integration/publication belong
to TASK-0015 and are not claimed complete by this preparation task.

- Planning commits 7abfbbc, f319911 and 8e280b9 preceded the respective source,
  privacy and test-dependency changes. The user's latest-CI preference is recorded.
- Source package/CLI/extension/workflow/current docs agree on 0.1.2; supported
  minima and historical v0.1.1 evidence are preserved.
- Node 26.13.1, pnpm 11.22.0, ACKit 0.5.5 and private Spec Kit 1.4.2 on Windows:
  frozen install, lint/format/typecheck/build, 6 files / 50 tests, CLI smoke and
  extension smoke (7 commands/5 hooks) PASS. Actual tarball installation PASS.
- Seven executable/workflow contracts pass. Old npm/GitHub lookup errors
  authorized publish/resume (two reproduced failures); corrected gates refuse
  them. Doctor's host-root disclosure was reproduced, then its portable-output
  regression passed with unchanged schema/environment exits.
- Real installed-package/native-extension demo: fresh PASS, successful gate,
  mutation -> STALE/refused gate, reverify, checkpoint/handoff and normal COMPLETE.
  Reviewed docs/evidence/release-demo-v0.1.2.txt contains no literal or JSON-escaped
  machine paths; the v0.1.0 transcript is unchanged.
- Zod 4.6.7, Vitest 4.1.12 and explicit Vite 8.3.3 dev peer: production AND full
  audit report ZERO advisories. The existing audit threshold is unchanged.
- ACKit config/doctor/task doctor/scan CI (95 >= 80), text hygiene and diff
  checks PASS. No new skipped assertions, runtime dependency, account/permission
  change or deployment. TASK-0015 owns the remaining hosted/publication gates.

### Initial planning baseline (historical)

Planning checkpoint, before implementation. Baseline installed tools: ACKit
0.5.5, Spec Kit 1.0.13, Node 26.13.1, pnpm 11.22.0. Current Spec Kit 1.4.2
requires Python >=3.11 and will be installed only in a private test environment.
ACKit doctor/config/task doctor pass; existing scanner fixture findings are
covered by the existing policy. Production audit reports one high Zod advisory.
