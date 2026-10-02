# Configuration

Committed config: `.ackit-spec-kit/config.yml` (schema version 1, validated
against `schemas/config.schema.json`). No executable code, no shell snippets.

```yaml
schemaVersion: 1
ackit:
  command: ackit        # ACKit executable
  minVersion: 0.5.0
specKit:
  command: specify      # Spec Kit executable
  minVersion: 1.0.0
mapping:
  mode: active-feature  # only supported mode in v0.1.0
verification:
  defaultProfile: standard
  stalePolicy: fail     # only supported policy in v0.1.0
profiles:
  quick: {}
  standard: {}
  high-risk: {}
evidence:
  redact: true
```

Validation errors are deterministic (`<path>: <message>`); an invalid config
puts the lifecycle into `BLOCKED` with `CONFIG_INVALID` instead of crashing.
