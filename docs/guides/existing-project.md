# Existing project

Already have code and want to adopt the bridge?

```powershell
ackit init
specify init --here --force --integration copilot
ackit-speckit init
ackit-speckit sync
ackit-speckit status
```

`--force` on `specify init` scaffolds shared infrastructure without touching
your source tree. `ackit-speckit init --dry-run` previews bridge writes first.
Sync maps the highest-numbered `specs/*/` directory; create at least
`spec.md` before syncing for a meaningful state.
