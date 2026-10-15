# ACKit Spec Kit Bridge feature reference (v0.1.1)

This index maps the **implemented and tested** bridge capabilities to maintained documentation and CLI commands. GitHub Spec Kit owns specifications; ACKit owns tasks, evidence and verification; the bridge synchronizes their state. This is a community integration, not an official GitHub product.

## Discovery, synchronization and lifecycle

| Capability | Command or surface | Reference |
| --- | --- | --- |
| Bootstrap without overwriting existing project config | `ackit-speckit init` | [Getting started](getting-started.md), [CLI](../reference/cli.md) |
| Environment/compatibility checks with stable IDs | `ackit-speckit doctor` | [Troubleshooting](troubleshooting.md), [compatibility](../reference/compatibility.md) |
| Active Spec Kit feature and artifact discovery | Spec Kit `spec.md`, `plan.md`, `tasks.md`, checklists | [Architecture](../architecture/overview.md), [ownership](../concepts/spec-kit-and-ackit.md) |
| Idempotent mapping from Spec Kit artifacts to ACKit tasks | `ackit-speckit sync` | [CLI](../reference/cli.md), [existing projects](existing-project.md) |
| Canonical read-only lifecycle state and explanations | `ackit-speckit status --json`, `ackit-speckit explain` | [Lifecycle status](../reference/lifecycle-status.md), [lifecycle](../architecture/lifecycle.md) |
| State transition and mutation boundaries | `UNINITIALIZED`, `READY`, `SPECIFIED`, `PLANNED`, `TASKED`, `IMPLEMENTING`, `VERIFIED`, `COMPLETE`, plus `STALE`/`BLOCKED` | [Lifecycle](../architecture/lifecycle.md) |

## Verification, completion and continuity

| Capability | Command or surface | Reference |
| --- | --- | --- |
| Quick, standard and high-risk verification profiles | `ackit-speckit verify --profile standard` | [CLI](../reference/cli.md), [configuration](../reference/configuration.md) |
| Canonical subject digest and redacted evidence digest | State-bound verification bundle | [State digest](../architecture/state-digest.md), [freshness](../concepts/verification-freshness.md) |
| FRESH / STALE / NOT_VERIFIED verdict logic and mutation detection | `ackit-speckit verify`, `ackit-speckit gate` | [Freshness](../concepts/verification-freshness.md), [trust-flow demo](trust-flow-demo.md) |
| Read-only completion gate rejects stale or failed verification | `ackit-speckit gate` | [CLI](../reference/cli.md), [lifecycle](../architecture/lifecycle.md) |
| Completion requires a fresh PASS; no automatic task completion | `ackit-speckit complete` | [Trust-flow demo](trust-flow-demo.md), [CLI](../reference/cli.md) |
| Reproducible checkpoints for resume | `ackit-speckit checkpoint` | [CLI](../reference/cli.md), [trust-flow demo](trust-flow-demo.md) |
| Human/agent deterministic handoffs | `ackit-speckit handoff --format markdown\|json` | [CLI](../reference/cli.md) |
| Machine-readable JSON schemas and stable exit codes | Configuration, status, verdict, bundle, checkpoint, handoff | [Schemas](../reference/schemas.md), [CLI](../reference/cli.md) |

## Spec Kit integration and security

| Capability | Command or surface | Reference |
| --- | --- | --- |
| Native Spec Kit `ackit` extension with seven commands | `spec-kit/extension` | [Spec Kit extension](spec-kit-extension.md), [ownership](../concepts/spec-kit-and-ackit.md) |
| `ackit-verified-sdd` workflow | `spec-kit/workflow` | [Spec Kit extension](spec-kit-extension.md) |
| Lifecycle hooks for after-specify/plan/tasks and implementation gates | Extension hooks | [Spec Kit extension](spec-kit-extension.md) |
| Security: offline-first, redaction, process isolation, path containment | Bounded files and subprocesses, no telemetry | [Security model](../architecture/security-model.md) |
| Real CLIs, Windows/Linux CI and packaging checks | CI, smoke and integration tests | [CI](ci.md), [release guide](release.md) |
| Supported ACKit and Spec Kit version boundary | Compatibility contract | [Compatibility](../reference/compatibility.md) |

## Context7 and Docs7

Context7 indexes the root README and maintained feature documentation. The optional Docs7 site exposes the same content for people and agents. Neither introduces an online dependency into the local runtime. See [administration and verification](context7-docs7.md).
