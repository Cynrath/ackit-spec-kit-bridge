# ACKit Spec Kit Bridge

> ACKit Spec Kit Bridge connects GitHub Spec Kit's intent-driven development artifacts to ACKit's deterministic repository context, task lifecycle, evidence, verification, and completion gates.

Community integration for ACKit and GitHub Spec Kit. Not an official GitHub integration.

```text
Spec Kit intent
    ↓
spec / plan / tasks artifacts
    ↓
ACKit task + refs            (ackit-speckit sync)
    ↓
implementation
    ↓
verification bundle          (ackit-speckit verify)
    ↓
independent verdict + freshness
    ↓
completion gate              (ackit-speckit gate)
    ↓
checkpoint / resume / handoff
```

- GitHub Spec Kit = intent + specification + planning + task decomposition + convergence.
- ACKit = deterministic execution context + repository rules + security/policy + task state + evidence + verification + completion trust + resume/handoff.
- Offline-first at runtime. No cloud APIs, no LLM API, no hosted service, no telemetry.

## Prerequisites

- Node.js >= 22, pnpm 11
- ACKit CLI (`npm install -g @cynrath/agent-context-kit`, tested 0.5.4)
- Spec Kit `specify` CLI (tested 1.0.13, Python 3.11+ via `uv tool install specify-cli`)
- Git, PowerShell 7+ on Windows

## Install

```powershell
npm install -g @cynrath/ackit-spec-kit-bridge
ackit-speckit version
ackit-speckit --help
```

## 5-minute quickstart

```powershell
git init
ackit init
specify init --here --integration copilot
ackit-speckit init
ackit-speckit sync
ackit-speckit status --json
ackit-speckit verify --profile standard
ackit-speckit gate
```

Mutate anything under test and watch freshness work:

```powershell
ackit-speckit verify --profile standard   # PASS
ackit-speckit gate                        # PASS
# ... edit specs/001-*/spec.md ...
ackit-speckit status                      # STALE
ackit-speckit gate                        # FAIL (exit 1)
ackit-speckit verify --profile standard   # PASS again
ackit-speckit checkpoint
ackit-speckit handoff
ackit-speckit complete                    # only after fresh PASS gate
```

POSIX shells work identically (`ackit-speckit doctor`, etc.).

## CLI

| Command | Purpose |
|---|---|
| `init [--dry-run]` | Verify repo/ACKit/Spec Kit, write config + state dirs + mapping |
| `doctor [--json]` | Environment + compatibility checks with stable check IDs |
| `sync [--dry-run]` | Map active Spec Kit feature → ACKit task (idempotent) |
| `status [--json]` | Read-only canonical lifecycle state (never writes) |
| `verify --profile quick\|standard\|high-risk [--json]` | State-bound bundle + verdict |
| `gate [--json]` | Read-only completion gate (STALE fails) |
| `checkpoint [--json]` | Deterministic resume checkpoint |
| `handoff [--format markdown\|json]` | Human/agent handoff |
| `complete [--json]` | Gate-checked ACKit task completion |
| `explain [--json]` | Lifecycle + gate provenance |
| `version [--json]` | Bridge + compat versions |

Exit codes: `0` success/pass · `1` gate/verification failed or stale ·
`2` usage/config error · `3` environment/dependency error ·
`4` security boundary violation · `5` internal error.

Every `--json` payload validates against `schemas/`.

## Spec Kit extension

```powershell
specify extension add ackit --dev ./spec-kit/extension
specify extension list
specify artifact list --json
```

Commands: `speckit.ackit.sync|status|verify|gate|checkpoint|handoff|complete`
(each delegates to `ackit-speckit`). Hooks: `after_specify`, `after_plan`,
`after_tasks` → sync; `before_implement` → status preflight;
`after_implement` → verify (never auto-completes). Workflow:
`spec-kit/workflow/workflow.yml` (`ackit-verified-sdd`).

See [docs/guides/spec-kit-extension.md](docs/guides/spec-kit-extension.md).

## Example lifecycle

```powershell
ackit-speckit sync
ackit-speckit status                        # TASKED
ackit-speckit verify --profile standard     # PASS, binds subject+evidence digests
ackit-speckit gate                          # PASS
ackit-speckit checkpoint
ackit-speckit handoff
ackit-speckit complete                      # COMPLETE
```

## Freshness / gate model

A verdict binds `subjectDigest + evidenceDigest + profile + result`.
`subjectDigest` covers Spec Kit artifacts, ACKit task/config/policy, bridge
config/profile/version, tool versions, and Git HEAD/diffs. Recomputing the
digest on `status`/`gate` and comparing with the stored verdict yields
`FRESH`, `STALE`, or `NOT_VERIFIED`; `stalePolicy: fail` means STALE fails the
gate. Details: [docs/architecture/state-digest.md](docs/architecture/state-digest.md).

## Supported versions

| Component | Tested |
|---|---|
| Node | >= 22 (24.13.0) |
| pnpm | 11.22.0 |
| ACKit | 0.5.4 (min 0.5.0) |
| Spec Kit | 1.0.13 (min 1.0.0) |
| OS | Windows + Linux (CI); macOS best-effort |

## CI usage

```yaml
- run: npx --yes @cynrath/ackit-spec-kit-bridge doctor
- run: ackit-speckit verify --profile standard
- run: ackit-speckit gate
```

## Security / offline

Offline-first runtime, no telemetry, argv arrays with `shell: false`, path
containment, bounded reads/output, redacted evidence, atomic state writes.
See [docs/architecture/security-model.md](docs/architecture/security-model.md)
and [SECURITY.md](SECURITY.md).

## Docs

- [Architecture overview](docs/architecture/overview.md) · [lifecycle](docs/architecture/lifecycle.md) · [state digest](docs/architecture/state-digest.md) · [security](docs/architecture/security-model.md)
- [Getting started](docs/guides/getting-started.md) · [existing project](docs/guides/existing-project.md) · [extension](docs/guides/spec-kit-extension.md) · [CI](docs/guides/ci.md) · [troubleshooting](docs/guides/troubleshooting.md)
- [CLI reference](docs/reference/cli.md) · [configuration](docs/reference/configuration.md) · [schemas](docs/reference/schemas.md) · [lifecycle status](docs/reference/lifecycle-status.md) · [compatibility](docs/reference/compatibility.md)
- [ROADMAP.md](ROADMAP.md) · [CHANGELOG.md](CHANGELOG.md)

## Links

- ACKit: <https://github.com/Cynrath/agent-context-kit>
- Spec Kit upstream: <https://github.com/github/spec-kit>
- License: MIT ([LICENSE](LICENSE))
