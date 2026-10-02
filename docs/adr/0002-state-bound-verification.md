# ADR 0002 — State-bound verification

- Status: accepted
- Date: 2026-10-02

## Context

A PASS verdict that survives later edits is worse than no verdict: it lets
stale trust gate completion.

## Decision

Every verdict binds `subjectDigest + evidenceDigest + profile + result`.
`subjectDigest` covers Spec Kit artifacts, ACKit task/config/policy, bridge
config/profile/version, tool versions, and Git HEAD/diffs. Freshness is a pure
recomputation: differ → STALE → gate FAIL (`stalePolicy: fail`).

## Consequences

- Verification is cheap to reason about and expensive to fake.
- Generated verdict/evidence files are excluded from the subject so a verdict
  never self-invalidates.
- Teams must re-verify after any subject change; `explain` shows exactly what changed.
