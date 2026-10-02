# Security model

## Trust boundaries

- **Untrusted**: Spec Kit artifact contents, ACKit task prose, file paths from
  state files, environment text, subprocess output. All are treated as data:
  bounded, redacted, never executed.
- **Trusted**: bridge source code, pinned CI actions, user-invoked CLIs.

## Controls

- Offline-first runtime: no sockets, no telemetry, no uploads in `src/`.
- Subprocess execution only via argv arrays with `shell: false`
  (`src/security/exec.ts`); command strings from uncontrolled input are prohibited.
- Canonical path containment (`src/security/paths.ts`): feature/task/config
  paths must resolve inside the repository (realpath-aware); traversal rejected
  with exit 4.
- Bounded reads (2 MB default) and bounded subprocess capture (512 KB); child
  timeouts everywhere (30s probes, up to 10 min for full suites).
- Redaction at construction (`src/security/redact.ts`): tokens, keys,
  passwords, connection values replaced with `[REDACTED]` before evidence is
  written; secret-looking object keys are scrubbed recursively.
- No environment dumps; no auth tokens in output; tool-not-installed is
  distinguished from check-failed.
- Atomic writes for mapping/verdict/bundle/checkpoint/handoff; temp-file cleanup.
- Windows paths with spaces, Unicode paths, and symlink escapes are tested
  (`tests/security/boundaries.test.ts`).

## Residual risks

- ACKit/Spec Kit CLIs themselves run with user privileges; the bridge cannot
  sandbox them beyond argv safety and timeouts.
- Redaction is pattern-based; truly novel secret formats should be reported so
  patterns can be extended.
