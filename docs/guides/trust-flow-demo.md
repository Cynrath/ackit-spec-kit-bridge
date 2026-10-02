# Trust-flow demo

The stale-verdict guarantee, end to end. Every command below is real; exit
codes are contractual (`0` pass, `1` gate/verification failure or stale).

## Setup

```powershell
npm install --global @cynrath/ackit-spec-kit-bridge
ackit-speckit doctor     # all prerequisites ok
ackit-speckit sync       # map the active Spec Kit feature → ACKit task
ackit-speckit status     # TASKED
```

## Verify → pass

```powershell
ackit-speckit verify --profile standard   # PASS (exit 0)
ackit-speckit gate                        # PASS (exit 0)
```

`verify` runs the profile checks, stores redacted evidence under
`.ackit-spec-kit/evidence/`, and records a verdict binding
`subjectDigest + evidenceDigest + profile + result`.

## Mutate → stale → gate refuses

Edit anything in the verified subject — `specs/001-*/spec.md`, `plan.md`,
`tasks.md`, the mapped ACKit task, bridge config/profile, or the Git diff:

```powershell
ackit-speckit status     # STALE (exit 0; state is reported, not failed)
ackit-speckit gate       # FAIL (exit 1, VERDICT_STALE)
```

`status` and `gate` recompute the subject digest and compare it with the
stored verdict. A mismatch means `STALE`; with `stalePolicy: fail` the gate
refuses completion.

## Re-verify → pass again

```powershell
ackit-speckit verify --profile standard   # PASS (exit 0), fresh verdict
ackit-speckit gate                        # PASS (exit 0)
ackit-speckit checkpoint                  # deterministic resume point
ackit-speckit handoff --format markdown   # human/agent handoff
ackit-speckit complete                    # COMPLETE — only on a fresh PASS
```

## Why it matters

Spec Kit converges on intent; ACKit trusts only bound state. The bridge
makes "verified" mean "verified *this exact state*" — not "verified at some
point in the past". See [verification freshness](../concepts/verification-freshness.md)
and [state digest](../architecture/state-digest.md).
