# AGENTS.md — ackit-spec-kit-bridge

ACKit Spec Kit Bridge (`ackit-speckit`, TypeScript + Node.js + pnpm) ships as
the scoped npm package `@cynrath/ackit-spec-kit-bridge` (CLI binary
`ackit-speckit`). Community integration for ACKit and GitHub Spec Kit.

## Version truth

- `package.json` is authoritative for the source-checkout package version.
- The latest immutable npm/GitHub Release is authoritative for published stable.
- `docs/reference/compatibility.md` pins the tested ACKit / Spec Kit ranges.

## Workflow

- ACKit-first / task-first / docs-first: real work needs an ACKit task
  (`ackit task create "<title>"`); one active checklist item at a time.
- Spec Kit dogfooding: constitution + spec/plan/tasks live under `specs/`.
- Canonical branch is `main`. Changes land via PR with green CI.
- Never commit generated junk: `.ackit/`, `dist/`, `node_modules/`,
  coverage, packed tarballs, `.ackit-spec-kit/verdicts|bundles|checkpoints|handoffs|evidence|state`.

## Validation (repository-built CLI only after `pnpm build`)

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

## Safety

- Offline-first runtime: no network calls, telemetry, or uploads in product code.
- Subprocesses use argv arrays with `shell: false`; never interpolate untrusted
  values into shell strings.
- No secrets or absolute local paths in artifacts or terminal output; evidence
  is redacted at construction.
- User files are never overwritten without explicit intent flags.
