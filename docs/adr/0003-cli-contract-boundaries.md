# ADR 0003 — CLI contract boundaries

- Status: accepted
- Date: 2026-10-02

## Context

Deep integration (importing ACKit/Spec Kit internals) would be brittle across
independent release lines; shallow integration risks missing semantics.

## Decision

Prefer, in order: (1) documented/stable CLI JSON contracts, (2) public SDK
APIs already used publicly, (3) documented versioned filesystem contracts.
Never import private internals. Subprocesses use argv arrays with
`shell: false`. The bridge stays usable without the ACKit source checkout.

## Consequences

- Slower than in-process calls but robust across versions; failures are
  diagnosable (`tool-not-installed` vs `check-failed`).
- Contract drift is handled by compatibility pins + `doctor`, not by patching
  around internals.
