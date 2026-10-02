# CLI reference

All commands accept `--help`. Machine-readable commands accept `--json`.
Global: `ackit-speckit [--root <path>] [--json] <command>`.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | success / PASS |
| 1 | gate/verification failed or stale |
| 2 | usage / configuration error |
| 3 | environment / dependency error |
| 4 | security boundary violation |
| 5 | unexpected internal error |

## init

`ackit-speckit init [--dry-run] [--json]` — verify Git/ACKit/Spec Kit, create
`.ackit-spec-kit/config.yml` + state dirs, map the active feature. Idempotent;
never overwrites user config.

## doctor

`ackit-speckit doctor [--json]` — deterministic checks with stable IDs:
`node`, `ackit-cli`, `speckit-cli`, `git`, `ackit-init`, `speckit-init`,
`active-feature`, `bridge-config`, `mapping`, `verdict-fresh`.

## sync

`ackit-speckit sync [--dry-run] [--json]` — resolve the active feature from
Spec Kit project state, attach (not copy) artifacts, create/update
`.ackit-spec-kit/mapping.json` without duplicating history. Safe to re-run.

## status

`ackit-speckit status [--json]` — read-only canonical lifecycle state;
`status --json` validates against `schemas/status.schema.json`.

## verify

`ackit-speckit verify --profile quick|standard|high-risk [--json]` —
default `standard`. Computes `subjectDigest`, runs profile checks, writes the
redacted bundle (`.ackit-spec-kit/bundles/<digest>.json`) and verdict
(`verdicts/latest.json`). Failing runs are recorded as FAIL, never PASS.

## gate

`ackit-speckit gate [--profile standard] [--json]` — read-only. Passes only
with a fresh PASS verdict, required artifacts, valid mapping, complete profile
checks, and no blocking security result. STALE fails.

## checkpoint

`ackit-speckit checkpoint [--blockers a,b] [--json]` — writes
`.ackit-spec-kit/checkpoints/CP-<ts>.json` (validates against
`schemas/checkpoint.schema.json`). Never includes secrets.

## handoff

`ackit-speckit handoff [--format markdown|json] [--out <path>]` — renders
goal, state, mapping, completion, blockers, verification, freshness, next
actions, checkpoint ref, Git state. Validates against
`schemas/handoff.schema.json`.

## complete

`ackit-speckit complete [--json]` — runs the gate, refuses on
FAIL/STALE/BLOCKED/NOT_VERIFIED, then delegates to `ackit task complete`
and persists completion evidence.

## explain

`ackit-speckit explain [--json]` — provenance: considered Spec Kit files,
mapped task, policies, freshness components, stale cause, blockers.

## version

`ackit-speckit version [--json]` — bridge, Node, and compatibility matrix.
