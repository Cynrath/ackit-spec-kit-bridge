# Feature Specification: ACKit Spec Kit Bridge v0.1.0

- Feature: `001-bridge-v0-1-0`
- Constitution: `.specify/memory/constitution.md`
- Status: active

## Goal

Ship a public, tested v0.1.0 bridge that connects GitHub Spec Kit's
intent-driven artifacts to ACKit's deterministic repository context, task
lifecycle, evidence, verification, and completion gates — so Spec Kit stays
responsible for intent/specification/planning while ACKit provides execution
trust.

## Users

- Developers using Spec Kit for SDD who need deterministic verification,
  completion gating, and resume/handoff.
- ACKit users who want Spec Kit intent artifacts governed by ACKit tasks,
  policy, and evidence.

## Requirements

1. **CLI**: `ackit-speckit` with `init`, `doctor`, `sync`, `status`,
   `verify`, `gate`, `checkpoint`, `handoff`, `complete`, `explain`,
   `version`; stable exit codes 0–5; `--help` + `--json` everywhere
   machine-readable output is meaningful.
2. **Sync**: resolve the active feature from Spec Kit project state (never the
   Git branch alone), discover spec/plan/tasks + supporting artifacts,
   create/update the ACKit task mapping deterministically and idempotently.
3. **Status**: read-only canonical lifecycle
   (UNINITIALIZED/READY/SPECIFIED/PLANNED/TASKED/IMPLEMENTING/VERIFIED/
   STALE/BLOCKED/COMPLETE) with documented derivation rules.
4. **Verification**: `quick` ⊂ `standard` ⊂ `high-risk` profiles producing a
   state-bound bundle + verdict; STALE on any subject change; gate passes only
   on fresh PASS with required artifacts and no blocking security result.
5. **Continuity**: deterministic secret-free checkpoints and Markdown/JSON
   handoffs; safe `complete` that gates first and delegates to ACKit.
6. **Spec Kit native**: installable extension (id `ackit`, 7 commands, 5 hooks)
   plus an `ackit-verified-sdd` workflow using Spec Kit's own engine.
7. **Trust**: offline-first, no telemetry, argv-only subprocesses, path
   containment, redacted evidence, atomic writes; release-blocking security tests.

## Non-goals (v0.1.0)

No Spec Kit fork, no ACKit fork, no replacement for
specify/plan/tasks/implement/converge, no custom workflow DSL, no SaaS, no
LLM layer, no arbitrary shell configuration, no opaque AI verdicts.

## Acceptance

- All CLI commands work with `--json` validating against `schemas/`.
- `verify → gate PASS → mutate spec → STALE → gate FAIL → reverify → PASS`
  demonstrated with real CLIs.
- Extension installs (`--dev` + packaged zip), commands register, hooks
  registered, workflow validates.
- CI green on Windows + Ubuntu; `ackit scan --ci` clean; release artifacts
  (tarball, extension zip, workflow zip, SHA256SUMS) published on GitHub.

