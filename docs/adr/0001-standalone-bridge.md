# ADR 0001 — Standalone bridge + native extension

- Status: accepted
- Date: 2026-10-02

## Context

ACKit (deterministic context/governance) and Spec Kit (intent/spec/planning)
overlap at the handoff between planning and execution. Options: fork Spec Kit,
fork ACKit, or build a standalone bridge with a native extension.

## Decision

Standalone TypeScript/Node.js bridge CLI plus a native Spec Kit extension
package. The bridge depends only on stable filesystem and CLI contracts of
both systems.

## Consequences

- No upstream forks to maintain; upstream upgrades are compatibility work, not merges.
- Extension commands delegate to the CLI; no logic duplicated in Markdown.
- The bridge must track two upstream contracts (ACKit CLI JSON, Spec Kit
  extension manifest v1.0) and pin tested ranges.
