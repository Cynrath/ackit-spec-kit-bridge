# Compatibility

Current validation snapshot for v0.1.2:

| Component | Supported / tested |
|---|---|
| Node | >= 22 (22/24 in CI; 26.13.1 locally) |
| pnpm | 11.22.0 |
| ACKit | >= 0.5.0 (tested 0.5.5) |
| Spec Kit (`specify`) | >= 1.0.0 (tested 1.4.2) |
| Windows | supported (PowerShell 7+) |
| Linux (Ubuntu) | supported (CI) |
| macOS | best-effort (no macOS CI claim) |

Bridge versioning is independent from ACKit and Spec Kit versions (semver).
`doctor` reports live compatibility; mismatches are environment errors, not
crashes. CI installs the latest ACKit and Spec Kit once per job; the versions
above describe observed validation, not installation constraints. Release notes
record the tools actually installed for that run. Minimum versions are unchanged.

Historical baseline: published v0.1.1 was validated with ACKit 0.5.4, Spec Kit
1.0.13 and Node 24.13.0 on Windows/Ubuntu. That release and its evidence remain
immutable; the historical numbers are not current recommended pins.
