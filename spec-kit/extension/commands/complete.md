---
description: "Complete via the safe gate-checked path"
---

# ACKit Complete

Complete through the safe path: the gate must pass with a fresh PASS verdict
before the ACKit task is completed. Never auto-complete after implementation.

## Prerequisites

1. A fresh PASS verdict exists (`ackit-speckit verify`, then `ackit-speckit gate`).

## User Input

$ARGUMENTS

## Steps

### Step 1: Check the gate

```powershell
ackit-speckit gate
```

### Step 2: Complete

```powershell
ackit-speckit complete
```

## Notes

- Completion is refused on FAIL, STALE, BLOCKED, or NOT_VERIFIED.
- The bridge delegates task completion to ACKit's own task lifecycle.
- <!-- Extension: ackit -->
