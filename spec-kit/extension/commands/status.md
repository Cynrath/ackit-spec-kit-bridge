---
description: "Show the canonical ACKit bridge lifecycle status"
---

# ACKit Status

Show the read-only canonical lifecycle status derived from Spec Kit state,
ACKit task state, repository state, and verdict freshness.

## Prerequisites

1. The bridge is initialized (`ackit-speckit init`).

## User Input

$ARGUMENTS

## Steps

### Step 1: Show status

```powershell
ackit-speckit status
```

For machine-readable output:

```powershell
ackit-speckit status --json
```

## Notes

- Status never modifies files.
- Possible states: UNINITIALIZED, READY, SPECIFIED, PLANNED, TASKED,
  IMPLEMENTING, VERIFIED, STALE, BLOCKED, COMPLETE.
- <!-- Extension: ackit -->
