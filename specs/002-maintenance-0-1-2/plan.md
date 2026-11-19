# Plan: bridge 0.1.2 maintenance

1. TASK-0012: current CLI compatibility, patched Zod, coupled version metadata,
   current docs/pins, fail-closed/processing-aware release checks and local proof.
2. TASK-0015: green PR, main integration, new immutable tag and automatic OIDC
   publication, followed by independent consumers and checksum verification.
3. Website repository task: consume the verified stable bridge/ACKit sources,
   regenerate product docs, align root discovery/JSON-LD and verify the site.

Use existing TypeScript/Node/pnpm and Spec Kit artifact formats. No new runtime
dependency, public schema ID, supported-minimum change or network service.
Production dependency audit, real lifecycle, packaging, lint/typecheck/tests,
ACKit checks and hosted CI must pass before publishing. Preserve old transcripts.
