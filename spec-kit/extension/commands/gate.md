---
description: "Check the completion gate (read-only)"
---

# ACKit Gate

Check the read-only completion gate. The gate passes only with a fresh PASS
verdict, valid task state, required artifacts, and no blocking security result.

## Prerequisites

1. A verdict exists (`ackit-speckit verify`).

## User Input

$ARGUMENTS

## Steps

### Step 1: Check the gate

```powershell
ackit-speckit gate
```

## Notes

- If subject state changed after verification, the gate fails with STALE.
- The gate never modifies files.
- <!-- Extension: ackit -->
