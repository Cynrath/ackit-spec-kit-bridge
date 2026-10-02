# ackit-verified-sdd workflow

A Spec Kit workflow that orchestrates the official SDD lifecycle
(`specify` → `plan` → `tasks` → `implement`) with ACKit bridge sync,
verification, and gated completion at the right points.

It coordinates official Spec Kit capabilities; it does not reimplement them.
Completion stays explicit: the workflow surfaces `verify`/`gate` results but
never auto-completes the ACKit task.

Install:

```powershell
specify workflow add ./spec-kit/workflow --force
specify workflow list
```
