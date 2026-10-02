# Spec Kit extension

## Install

```powershell
specify extension add ackit --dev ./spec-kit/extension
specify extension list
specify extension info ackit
```

## Commands

Each command delegates to the bridge CLI:

| Spec Kit command | CLI equivalent |
|---|---|
| `speckit.ackit.sync` | `ackit-speckit sync` |
| `speckit.ackit.status` | `ackit-speckit status` |
| `speckit.ackit.verify` | `ackit-speckit verify --profile standard` |
| `speckit.ackit.gate` | `ackit-speckit gate` |
| `speckit.ackit.checkpoint` | `ackit-speckit checkpoint` |
| `speckit.ackit.handoff` | `ackit-speckit handoff` |
| `speckit.ackit.complete` | `ackit-speckit complete` |

## Hooks

`after_specify` / `after_plan` / `after_tasks` suggest sync;
`before_implement` suggests a status preflight;
`after_implement` suggests verification. Completion is never automatic.

## Packaged artifact

Release archives (`ackit-extension-*.zip`) install identically:

```powershell
specify extension add ackit --from ./ackit-extension-v0.1.1.zip
```
