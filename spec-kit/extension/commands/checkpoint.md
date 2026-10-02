---
description: "Create a deterministic resume checkpoint"
---

# ACKit Checkpoint

Create a deterministic checkpoint with everything another agent or session
needs to continue safely. Never includes secrets.

## Prerequisites

1. The bridge is initialized and synced.

## User Input

$ARGUMENTS

## Steps

### Step 1: Create the checkpoint

```powershell
ackit-speckit checkpoint
```

## Notes

- The checkpoint binds feature, task, lifecycle, Git HEAD, digests,
  verification state, blockers, and next commands.
- <!-- Extension: ackit -->
