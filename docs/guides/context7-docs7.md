# Context7 indexing and Docs7 hosting

This guide describes documentation distribution only. It does not introduce network access into the ackit-spec-kit-bridge CLI or change the existing GitHub Pages website.

## 1. Indexing configuration

The repository root `context7.json` sets the library title, description, best-practice rules and current documentation folders. The README and maintained `docs/guides`, `docs/reference` and `docs/concepts` pages remain the source of truth. Historical tasks, generated output and tests are excluded.

Context7 library ID convention: `/cynrath/ackit-spec-kit-bridge`. **Confirm the actual library ID in your Context7 dashboard before switching configuration sources**. Indexing, ownership and verified-badge status are separate.

## 2. Existing ownership and configuration source

The library is already **owned by the maintainer's teamspace**, so Claim Library is unnecessary. Do not add a fabricated `public_key`.

The admin UI currently displays **Config source: Configuration is managed here**. In that mode, edits in the admin form control indexing; committing `context7.json` alone does not make it active.

Choose one approach:

1. **Dashboard-managed:** edit Configuration fields, **Save changes**, then **Refresh**.
2. **Repository-managed:** compare the current dashboard include/exclude rules with the committed `context7.json` first; then click **Config source → Switch** and **Refresh**. GitHub configuration is now the source of truth.

The dashboard currently shows more folder/file exclusion entries than the repository file. Do not switch without checking whether those additional exclusions are needed. Keep **Index every version, old ones too** disabled unless legacy documentation should be searchable.

Context7 tokens, npm credentials and private secrets must never be committed. [Claiming libraries](https://context7.com/docs/howto/claiming-libraries) is only relevant if ownership is removed later.

## 3. Apply for the verified badge

Open the already-owned library's **Admin** page and choose the orange **Apply for Verification** link. Context7 may grant the badge automatically based on reputation or quality thresholds. If the instant check does not qualify, provide the official documentation URL, a factual project description and developer value in the manual application. Verification is free; approval is decided by Context7, not by a repository setting.

## 4. Connect Docs7 Free (optional; existing GitHub Pages stays active)

1. Open [Docs7](https://context7.com/docs7) while signed into Context7.
2. Add a new site from GitHub; select `Cynrath/ackit-spec-kit-bridge`.
3. Set production branch to `main`, and **Docs path** to `docs`. The `docs/docs.json` file defines the navigation and `docs/index.mdx` is the entry page.
4. Publish the site. Keep the assigned `*.docs7.io` address separate from existing GitHub Pages until you intentionally decide otherwise.
5. Enable **Add to Context7** when connecting the repository (or use the site's **Context7** tab) so successful production builds refresh the library automatically. Do not create a duplicate library if the original GitHub library is already registered.

Docs7 Free currently allows up to three sites. The hosted documentation site and agent-readable endpoints are available on Free; autonomous Docs7 documentation editing agents and PR previews require Pro.

## 5. Verify deployment and indexing

After the Docs7 production build is successful, open:

- the Docs7 site root and a guide/reference page;
- `/llms.txt` and `/llms-full.txt` on that site;
- `/guides/getting-started.md` for an agent-readable page;
- the Context7 library page, making sure the new documentation and code examples are retrievable;
- the Context7 library Admin page for ownership/config source and verification status.

If configuration changes do not appear, use the library page's **Refresh** and inspect the Docs7 build log. Context7 may also refresh public libraries automatically.

## 6. Releases

Publishing docs does not require a new npm version. Follow repository version/release governance and keep existing published npm packages, tags, GitHub Releases and (where applicable) VS Code Marketplace builds immutable. Do not claim a release until its CI, registry and documentation checks actually pass.

Official references: [Context7 Library Owners](https://context7.com/docs/library-owners), [Claim Your Library](https://context7.com/docs/howto/claiming-libraries), [Verify Your Library](https://context7.com/docs/howto/verification), [Docs7 Quickstart](https://context7.com/docs/docs7/quickstart), [Docs7 Agent Readiness](https://context7.com/docs/docs7/agent-readiness).
