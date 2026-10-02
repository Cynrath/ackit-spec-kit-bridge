---
description: "Run state-bound verification and record a verdict"
---

# ACKit Verify

Produce a state-bound verification bundle and verdict for the current subject
state. The verdict is valid only for the exact state that was verified.

## Prerequisites

1. The bridge is initialized and synced (`ackit-speckit sync`).

## User Input

$ARGUMENTS

## Steps

### Step 1: Run verification (default profile)

```powershell
ackit-speckit verify --profile standard
```

For rapid iteration:

```powershell
ackit-speckit verify --profile quick
```

For release-grade checks:

```powershell
ackit-speckit verify --profile high-risk
```

## Notes

- A failed or incomplete run is never recorded as PASS.
- Any later change to spec, plan, tasks, ACKit task/config/policy, bridge
  config, or the Git diff makes the verdict STALE.
- <!-- Extension: ackit -->
