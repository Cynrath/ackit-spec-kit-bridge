# CLAUDE.md — ackit-spec-kit-bridge

This file mirrors `AGENTS.md` for Claude Code. The authoritative policy lives
in `AGENTS.md`; this file is a concise equivalent so Claude operates under the
same ACKit-first contract.

- Package: `@cynrath/ackit-spec-kit-bridge`, binary `ackit-speckit`, Node >= 22, pnpm.
- Task-first: create/find the ACKit task before implementing; record evidence.
- Docs-first: update `docs/`, schemas, and `CHANGELOG.md` with behavior changes.
- Validate with: `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm build`,
  `pnpm test`, `pnpm smoke:cli`, `ackit scan --ci`, `node dist/cli/index.js doctor`.
- Offline-first: no network/telemetry in runtime; argv arrays, `shell: false`;
  redact secrets; no absolute local paths in artifacts.
- Branch `main`; PR with green CI; never commit `dist/`, `.ackit/`, tarballs.
