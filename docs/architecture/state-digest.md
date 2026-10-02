# State digest

Two-part model: `subjectDigest` identifies the verified state;
`evidenceDigest` identifies the generated evidence. The verdict binds both.

## Inputs (`src/verification/subject.ts`)

- Spec Kit: active feature `spec.md`, `plan.md`, `tasks.md`, `research.md`,
  `data-model.md`, `quickstart.md`, `checklists/` contents, constitution,
  `integration.json`.
- ACKit: mapped task file, `ackit.yml`, policy pack file.
- Bridge: canonical config, bridge version, verification profile.
- Tools: normalized ACKit / Spec Kit / Node versions.
- Git: HEAD, staged/unstaged diff digests (line-ending normalized),
  untracked files as sorted `path:content-hash` entries (names alone would
  miss edits in a no-commit tree; files over 1 MB contribute a size marker),
  generated `.ackit-spec-kit/{verdicts,bundles,evidence,checkpoints,handoffs,
  state}/` outputs excluded so a verdict never self-invalidates.

## Normalization and exclusions

- Canonical JSON (sorted keys, sorted component list) before hashing.
- File contents: CRLF → LF only; no semantic normalization that could hide a change.
- Filesystem iteration order is always sorted.
- Absolute machine paths never enter the digest (repo-relative only).
- Timestamps are metadata, never digest inputs.
- Generated verdict/evidence/bundle/checkpoint files are excluded so a verdict
  never self-invalidates.

## Freshness

`status`/`gate` recompute `subjectDigest` and compare with the stored verdict:

```text
equal   → FRESH (gate may pass)
differ  → STALE (gate fails with VERDICT_STALE)
missing → NOT_VERIFIED (gate fails with NOT_VERIFIED)
```

`stalePolicy: fail` is the only v0.1.0 policy.
