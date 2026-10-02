# Schemas

Public v0.1.1 contracts. Every `--json` payload carries its schema id.

| Artifact | File | Schema id |
|---|---|---|
| Bridge config | `schemas/config.schema.json` | (YAML config, `schemaVersion: 1`) |
| Status | `schemas/status.schema.json` | `ackit.speckit.status.v1` |
| Verification bundle | `schemas/verification-bundle.schema.json` | `ackit.speckit.verification-bundle.v1` |
| Verdict | `schemas/verdict.schema.json` | `ackit.speckit.verdict.v1` |
| Checkpoint | `schemas/checkpoint.schema.json` | `ackit.speckit.checkpoint.v1` |
| Handoff | `schemas/handoff.schema.json` | `ackit.speckit.handoff.v1` |
| Doctor | (inline, `ackit.speckit.doctor.v1`) | `ackit.speckit.doctor.v1` |
| Gate / verify / sync / init / complete / explain / version | (inline envelopes) | `ackit.speckit.<cmd>.v1` |

Rules: schema id/version required; malformed required fields rejected;
repo-relative paths only (no absolute machine paths in JSON).
