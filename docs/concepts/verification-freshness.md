# Verification freshness

"Verified" means "verified *this exact state*" — never "verified at some
point in the past".

## Two digests

- **Subject digest** — SHA-256 over the verified subject: Spec Kit artifacts
  (spec/plan/tasks/checklists), the mapped ACKit task/config/policy
  snapshot, bridge config/profile/version, tool versions
  (node/ackit/specify), and Git HEAD plus diffs. Any edit, rebase, or
  config change moves the digest.
- **Evidence digest** — SHA-256 over the redacted per-check outputs stored
  under `.ackit-spec-kit/evidence/`. Secrets are redacted at construction;
  the digest covers the redacted bytes.

A verdict record binds `subjectDigest + evidenceDigest + profile + result
(PASS/FAIL/BLOCKED)` with timestamps.

## Freshness comparison

`status` and `gate` recompute the current subject digest and compare it with
the stored verdict:

| Stored verdict | Current subject | Freshness |
|---|---|---|
| none | anything | `NOT_VERIFIED` |
| digest A | digest A | `FRESH` |
| digest A | digest B | `STALE` |

`stalePolicy: fail` (the only supported mode) means `STALE` fails the gate
with reason `VERDICT_STALE` and exit code 1. There is no "accept stale"
flag — re-run `verify` to bind a fresh verdict.

## Profiles and rank

Profiles are ranked `quick < standard < high-risk`. A verdict satisfies a
gate expecting profile P when `rank(verdict.profile) >= rank(P)`
(`profileSatisfies`). Higher-assurance verification always covers lower
gates; the reverse never holds.

## Lifecycle effect

Freshness feeds the canonical lifecycle: fresh `PASS` → `VERIFIED`; any
subject move under a stored verdict → `STALE`; fresh `PASS` plus a completed
ACKit task → `COMPLETE`. The gate additionally requires spec/plan/tasks +
mapping presence, no blocking security finding, and complete profile checks
(`GATE_PASS` only when every condition holds).
