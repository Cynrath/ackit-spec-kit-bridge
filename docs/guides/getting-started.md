# Getting started

## 1. Install the CLIs

```powershell
npm install -g @cynrath/agent-context-kit @cynrath/ackit-spec-kit-bridge
uv tool install specify-cli
ackit --version
specify --version
ackit-speckit version
```

## 2. Initialize a repository

```powershell
git init
ackit init
specify init --here --integration copilot
ackit-speckit init
```

## 3. Create a feature, sync, verify

```powershell
# ... create specs/001-*/spec.md, plan.md, tasks.md via your agent ...
ackit-speckit sync
ackit-speckit status --json
ackit-speckit verify --profile standard
ackit-speckit gate
ackit-speckit handoff
```
