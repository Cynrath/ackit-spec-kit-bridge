# Implementation Plan: Bridge v0.1.0

## Architecture

Standalone TypeScript/Node.js CLI + native Spec Kit extension (ADR-0001).
Adapters over stable CLI/filesystem contracts only (ADR-0003). State-bound
verification with two-part digests (ADR-0002).

```text
SpecKitAdapter / AckitAdapter / GitAdapter
  → LifecycleResolver (sync + deriveLifecycle)
  → StateDigester (canonical JSON + SHA-256)
  → Verifier (quick/standard/high-risk) + EvidenceCollector (redacted)
  → CompletionGate (pure) → CheckpointService / HandoffRenderer
  → CLI (commander, exit codes 0–5)
```

## Implementation order

1. Foundation: package/toolchain, `src/util`, `src/security` (exec/paths/redact).
2. Contracts: `src/config`, `schemas/*`, exit codes, compat matrix.
3. Adapters: speckit (integration.json, constitution, specs/), ackit-state
   (ackit.yml, docs/tasks/active), ackit CLI runner, git state.
4. Lifecycle: mapping store, `deriveLifecycle`, context loader.
5. Trust: subject computation, profile verifier, evidence digests, gate,
   checkpoint, handoff, all CLI commands.
6. Extension + workflow per Spec Kit manifest v1.0 / workflow schema v1.0.
7. Tests: unit → security → integration (temp repos, real CLIs) → E2E.
8. Docs/community/CI; dogfood (this repo); release.

## Key decisions

- Active feature = highest-numbered `specs/*/` directory (documented,
  deterministic; branch never authoritative).
- ACKit tasks discovered under `docs/tasks/active/` (`TASK-*` files).
- Mapping stored at `.ackit-spec-kit/mapping.json`; verdict at
  `verdicts/latest.json`; bundles content-addressed by subject digest.
- `quick`: config/policy/artifact/mapping checks. `standard`: + scan,
  typecheck, unit tests, version probes. `high-risk`: + full suite, build.
- Extension commands delegate to the CLI; hooks suggest, never auto-complete.

## Risks

- Upstream contract drift (ACKit CLI flags, Spec Kit manifest) → mitigated by
  `doctor` compat checks + pinned tested ranges + docs.
- Long verify times in fixture repos → bounded timeouts, quick profile for
  iteration, 60s vitest timeout.
