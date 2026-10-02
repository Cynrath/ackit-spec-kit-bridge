# Troubleshooting

## `ackit-speckit init` reports missing tools

- `ACKit not initialized`: run `ackit init` in the repo root first.
- `Spec Kit not initialized`: run `specify init --here ...` first.
- `not a git repository`: run `git init` first.

## `status` shows UNINITIALIZED

Check `ackit-speckit doctor`: it lists each check (`ackit-init`,
`speckit-init`, `active-feature`, `bridge-config`, `mapping`) with details.

## `gate` fails with VERDICT_STALE

Something in the subject changed (spec/plan/tasks, task file, configs,
tool versions, Git diff). Run `ackit-speckit explain --json` to see the
components, then `ackit-speckit verify --profile standard` to re-verify.

## `verify` fails on `ackit-policy`

`ackit policy check` is strict by design. Inspect the check summary in the
verify output, fix the policy finding, and re-run.

## `complete` refuses

Completion requires gate PASS: fresh PASS verdict + artifacts + mapping.
`complete` prints the exact reason codes; resolve them and retry.

## Bug reports

Include `ackit-speckit doctor --json` and `ackit-speckit explain --json`
(redacted by construction). See [SUPPORT.md](../../SUPPORT.md).
