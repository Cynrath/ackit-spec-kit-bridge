# ACKit Bridge Extension

Community integration for ACKit and GitHub Spec Kit.

This extension registers `speckit.ackit.*` commands that delegate to the
`ackit-speckit` CLI. Install the npm package first, then install this
extension in development mode:

```powershell
npm install -g @cynrath/ackit-spec-kit-bridge
specify extension add ackit --dev ./spec-kit/extension
```

Verify:

```powershell
specify extension list
specify extension info ackit
```
