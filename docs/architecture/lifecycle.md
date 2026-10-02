# Lifecycle

Deterministic state machine, defined in code (`src/lifecycle/status.ts`) and
mirrored here.

```text
UNINITIALIZED → READY → SPECIFIED → PLANNED → TASKED → IMPLEMENTING → VERIFIED → COMPLETE
                                                            ↘ STALE (any subject change)
                                                   BLOCKED (any mandatory gap)
```

## Derivation rules (in priority order)

1. ACKit or Spec Kit not initialized → `UNINITIALIZED`.
2. Malformed config/state or missing mapped task → `BLOCKED` with reason code.
3. No active feature → `READY`.
4. Task completed + fresh PASS → `COMPLETE`.
5. Verdict exists but subject digest changed → `STALE`.
6. Fresh PASS → `VERIFIED`.
7. FAIL verdict → `IMPLEMENTING`.
8. Spec missing → `READY`; plan missing → `SPECIFIED`;
   tasks or mapping missing → `PLANNED`.
9. Dirty Git diff → `IMPLEMENTING`; otherwise → `TASKED`.

## Notes

- `status` is read-only and never modifies files.
- Branch names are metadata only, never the active-feature authority.
- `VERIFYING` is not a persisted state: `verify` is an explicit command whose
  output (bundle + verdict) is observed by the next `status`/`gate`.
