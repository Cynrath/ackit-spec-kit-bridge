---
description: "Sync the active Spec Kit feature into the ACKit task lifecycle"
---

# ACKit Sync

Synchronize the current Spec Kit feature into ACKit's task/ref lifecycle.
This command delegates to the bridge CLI and never reimplements bridge logic.

## Prerequisites

1. The repository is initialized with Git, ACKit (`ackit init`), and Spec Kit (`specify init`).
2. The bridge CLI `ackit-speckit` is installed.

## User Input

$ARGUMENTS

## Steps

### Step 1: Run sync

```powershell
ackit-speckit sync
```

For a preview without writes:

```powershell
ackit-speckit sync --dry-run
```

### Step 2: Confirm status

```powershell
ackit-speckit status --json
```

## Notes

- The active feature is resolved from Spec Kit project state (never from the Git branch alone).
- Sync is deterministic and idempotent; it preserves ACKit task history.
- <!-- Extension: ackit -->
