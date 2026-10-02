# Contributing

Thanks for contributing to ACKit Spec Kit Bridge.

## Ground rules

- Read `AGENTS.md` first; ACKit-first / task-first / docs-first applies.
- One focused change per PR; keep history reviewable on `main`.
- Offline-first: no network calls or telemetry in runtime code.
- Never commit secrets, absolute local paths, `dist/`, `.ackit/`, tarballs,
  or bridge state (`verdicts/`, `bundles/`, `checkpoints/`, `handoffs/`, `evidence/`, `state/`).

## Development loop

```powershell
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm typecheck
pnpm build
pnpm test
pnpm smoke:cli
pnpm smoke:extension
ackit config check
ackit scan --ci
node dist/cli/index.js doctor
```

## PR checklist

- [ ] Task/issue linked with evidence
- [ ] Tests added or updated (unit + integration where behavior changed)
- [ ] Schemas + docs updated for contract changes
- [ ] `CHANGELOG.md` entry under Unreleased
- [ ] `ackit scan --ci` clean, lint/format/typecheck/build green
