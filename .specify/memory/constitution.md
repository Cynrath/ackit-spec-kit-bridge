# ACKit Spec Kit Bridge Constitution

## Core Principles

### I. Upstream Respect (NON-NEGOTIABLE)

Spec Kit owns intent/specification/planning; ACKit owns deterministic context,
task state, evidence, verification, and completion trust. The bridge never
forks either system and never reimplements `specify/plan/tasks/implement/
converge` or ACKit scanning/policy/readiness. Integration happens only through
stable CLI and filesystem contracts.

### II. Determinism First

Same repo content + ACKit state + Spec Kit state + bridge config + tool
versions + Git state + profile ⇒ same status JSON, digests, ordering, reason
codes, and evidence manifest. Timestamps are metadata, never digest inputs.

### III. State-Bound Trust (NON-NEGOTIABLE)

A verdict is valid only for the exact state verified. Any subject change
makes it STALE and fails the gate. Failed or incomplete runs are never PASS.
Completion requires a fresh PASS through the safe path only.

### IV. Offline-First Security

No network calls, no telemetry, no secret transmission in the runtime. Argv
arrays with `shell: false`; path containment; bounded reads/output; timeouts;
redaction before persistence; atomic writes.

### V. Evidence Over Prose

Every lifecycle claim must be backed by command output, test results, or
schema-validated artifacts. Dogfood both systems: this repository is built
with ACKit tasks and Spec Kit features, and releases only on green verification.

## Constraints

- Stack: TypeScript, Node.js >= 22, ESM, pnpm 11, MIT license.
- Smallest dependency set that gives production-quality behavior
  (`commander`, `yaml`, `zod` at runtime).
- Windows (PowerShell 7+) primary; Ubuntu supported in CI; macOS best-effort.
- `--json` formats and schemas are public contracts from v0.1.0.

## Development Workflow

ACKit-first / task-first / docs-first: real work needs an ACKit task with
acceptance criteria and recorded evidence. Spec/plan/tasks per feature under
`specs/`. Canonical branch `main`; PR with green CI; release via tag-triggered
workflow with tarball + extension/workflow archives + SHA256SUMS.
