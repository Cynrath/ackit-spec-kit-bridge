# Compatibility

v0.1.1 was tested against:

| Component | Supported / tested |
|---|---|
| Node | >= 22 (tested 24.13.0) |
| pnpm | 11.22.0 |
| ACKit | >= 0.5.0 (tested 0.5.4) |
| Spec Kit (`specify`) | >= 1.0.0 (tested 1.0.13) |
| Windows | supported (PowerShell 7+) |
| Linux (Ubuntu) | supported (CI) |
| macOS | best-effort (not tested in v0.1.1) |

Bridge versioning is independent from ACKit and Spec Kit versions (semver).
`doctor` reports live compatibility; mismatches are environment errors, not
crashes. Only Windows + Ubuntu CI ran for v0.1.1, as stated here.
