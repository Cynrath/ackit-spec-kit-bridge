# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| 0.1.x | Yes |

## Reporting a vulnerability

Open a GitHub Security Advisory or contact the maintainers via the repository's
private vulnerability reporting. Do not open a public issue for unpatched
vulnerabilities. We aim to acknowledge within 3 business days.

## Runtime posture

- Offline-first: the bridge makes no network calls and sends no telemetry.
- Subprocesses run with argv arrays and `shell: false`.
- Paths are contained to the repository; traversal and symlink escapes are rejected.
- File reads and subprocess output are bounded; child processes have timeouts.
- Evidence is redacted before persistence (tokens, keys, credentials).
- State files are written atomically; temp files are cleaned up.

## Scope

Do not test against infrastructure you do not own. Automated scanners against
this repository should be read-only and rate-limited.
