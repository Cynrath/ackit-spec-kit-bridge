---
description: "Create a human/agent-readable handoff"
---

# ACKit Handoff

Create a human- and agent-readable handoff derived from canonical state.

## Prerequisites

1. The bridge is initialized and synced.

## User Input

$ARGUMENTS

## Steps

### Step 1: Create the handoff

```powershell
ackit-speckit handoff
```

For JSON:

```powershell
ackit-speckit handoff --format json
```

## Notes

- The handoff covers goal, state, mapping, completion, blockers,
  verification, freshness, next actions, and Git state.
- <!-- Extension: ackit -->
