# Feature: current compatibility and release-reference maintenance

## User intent

Update the bridge and public site to current supported product references and
publish the bridge update to npm. Work stays on canonical main with authorized
commits/pushes and the established controlled release procedure.

## Requirements

- Revalidate ACKit 0.5.5 and Spec Kit 1.4.2 through real CLIs.
- Prepare compatible bridge 0.1.2; preserve existing minimum versions and schemas.
- Fix the confirmed Zod 4.6.5 advisory with patched compatible 4.6.7.
- Current docs/metadata/pins agree; historical release proof stays historical.
- Publish only after full local/hosted gates and immutable identity checks.
- The website advertises bridge 0.1.2 only after actual publication verification.

## Non-goals

New product features, cloud/account changes, global tool upgrades, historical
artifact replacement and changes to offline/freshness/completion safety rules.
