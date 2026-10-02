# Architecture overview

```text
SpecKitAdapter ──→ LifecycleResolver ──→ CompletionGate
AckitAdapter   ──→ StateDigester    ──→ Verifier ──→ EvidenceCollector
GitAdapter     ──→ CheckpointService / HandoffRenderer
Config loader ──→ CLI (ackit-speckit)
```

## Components

- **SpecKitAdapter** (`src/adapters/speckit.ts`): reads stable filesystem
  contracts (`.specify/integration.json`, `.specify/memory/constitution.md`,
  `specs/<feature>/`) plus `specify --version`. Never imports Spec Kit Python
  internals; never derives the active feature from the Git branch.
- **AckitAdapter** (`src/adapters/ackit.ts`, `ackit-state.ts`): invokes the
  stable ACKit CLI with argv arrays (`--json` where meaningful) and reads
  `ackit.yml` + `docs/tasks/active/`. Never imports ACKit private internals.
- **LifecycleResolver** (`src/lifecycle/`): `sync` maintains
  `.ackit-spec-kit/mapping.json`; `deriveLifecycle` computes one deterministic
  state from Spec Kit + ACKit + repo + verdict freshness.
- **StateDigester** (`src/verification/subject.ts`, `digest.ts`): canonical
  JSON + SHA-256 over ordered components; excludes generated verdict/evidence
  files so a verdict never self-invalidates.
- **EvidenceCollector / Verifier** (`src/verification/verifier.ts`): profile
  checks (`quick` ⊂ `standard` ⊂ `high-risk`), redacted evidence, deterministic
  manifest ordering, `evidenceDigest`.
- **CompletionGate** (`src/verification/gate.ts`): pure function over verdict
  freshness + artifacts + mapping + security; read-only.
- **CheckpointService / HandoffRenderer** (`src/checkpoint/`, `src/handoff/`):
  deterministic, secret-free resume artifacts.
- **CLI** (`src/cli/`): thin orchestration, stable exit codes, `--json`
  contracts versioned from day one.

## Boundaries

- The bridge never forks Spec Kit and never reimplements
  `specify/plan/tasks/implement/converge`.
- The bridge never reimplements ACKit scanning/policy/readiness; it composes
  them as subprocess checks and records their evidence.
- Spec Kit extension command files delegate to the CLI; workflow files use
  Spec Kit's own engine.
