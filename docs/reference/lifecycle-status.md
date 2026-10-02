# Lifecycle status

See [architecture/lifecycle.md](../architecture/lifecycle.md) for the state
machine. Status values:

| State | Meaning |
|---|---|
| UNINITIALIZED | ACKit or Spec Kit not initialized |
| READY | Initialized, no active feature (or spec missing) |
| SPECIFIED | Spec exists, plan missing |
| PLANNED | Plan exists, tasks or mapping missing |
| TASKED | Mapped, clean tree, no fresh verdict |
| IMPLEMENTING | Dirty diff or FAIL verdict, no fresh PASS |
| VERIFIED | Fresh PASS verdict, task not yet completed |
| STALE | Verdict exists but subject changed |
| BLOCKED | Malformed config/state or missing mapped task |
| COMPLETE | Task completed + completion evidence + fresh PASS |

`reasonCodes` are stable machine-readable strings (`VERDICT_STALE`,
`SPEC_MISSING`, `MAPPING_MISSING`, `GATE_PASS`, ...). `explain --json` gives
the full provenance.
