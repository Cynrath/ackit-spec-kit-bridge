# Spec Kit and ACKit

How the two systems divide responsibility — and where the bridge sits.

## Spec Kit owns intent

GitHub Spec Kit (`github/spec-kit`, `specify` CLI) owns the intent-driven
workflow: `specify` (constitution + feature spec), `plan` (technical plan),
`tasks` (decomposed work), `implement` (execution), converge (iteration to
done). Its artifacts live under `specs/NNN-name/` (`spec.md`, `plan.md`,
`tasks.md`, checklists) with active-feature tracking.

## ACKit owns trust

AgentContextKit (`@cynrath/agent-context-kit`, `ackit` CLI) owns
deterministic repository trust: context and instruction graphs, readiness,
policy-as-code, security scanning, the task lifecycle with acceptance
criteria, typed evidence, state-bound verification bundles and verdicts,
canonical status, checkpoints, and portable handoffs. It never reads Spec
Kit artifacts natively.

## The bridge coordinates

`@cynrath/ackit-spec-kit-bridge` (`ackit-speckit` CLI) connects them without
forking either side:

1. **Discover** — resolve the active Spec Kit feature and its artifacts
   (`SpecKitAdapter`).
2. **Map** — synchronize the feature into an ACKit task with explicit refs
   (`sync`, idempotent).
3. **Execute** — implementation happens normally; the bridge does not
   implement.
4. **Verify** — run profile checks, bind `subjectDigest + evidenceDigest +
   profile + result` into a verdict (`verify`).
5. **Gate** — refuse completion on anything but a fresh `PASS` (`gate`,
   `stalePolicy: fail`).
6. **Continue** — export deterministic resume context (`checkpoint`,
   `handoff`) and complete through ACKit's own lifecycle (`complete`).

The bridge never replaces Spec Kit's planning or ACKit's verification. It
is a community integration — not an official GitHub integration — and
introduces no dependency from ACKit core back to the bridge.
