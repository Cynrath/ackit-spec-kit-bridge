export interface Handoff {
  schemaVersion: number;
  schema: "ackit.speckit.handoff.v1";
  createdAt: string;
  goal: string;
  lifecycleState: string;
  feature: string | null;
  ackitTask: string | null;
  complete: string[];
  incomplete: string[];
  blockers: string[];
  lastVerification: { result: string | null; fresh: boolean | null; profile: string | null };
  freshness: string;
  nextActions: string[];
  checkpointRef: string | null;
  git: { head: string | null; branch: string | null; dirty: boolean; isRepo: boolean };
}

export function renderHandoffMarkdown(h: Handoff): string {
  const lines = [
    `# Handoff — ${h.goal}`,
    ``,
    `- Created: ${h.createdAt}`,
    `- Lifecycle: ${h.lifecycleState}`,
    `- Feature: ${h.feature ?? "(none)"}`,
    `- ACKit task: ${h.ackitTask ?? "(none)"}`,
    `- Freshness: ${h.freshness}`,
    `- Git: ${h.git.head ?? (h.git.isRepo ? "(repo, no commits yet)" : "no-repo")}${h.git.dirty ? " (dirty)" : " (clean)"}`,
    ``,
    `## Complete`,
    ...(h.complete.length > 0 ? h.complete.map((c) => `- [x] ${c}`) : [`(none)`]),
    ``,
    `## Not complete`,
    ...(h.incomplete.length > 0 ? h.incomplete.map((c) => `- [ ] ${c}`) : [`(none)`]),
    ``,
    `## Blockers`,
    ...(h.blockers.length > 0 ? h.blockers.map((c) => `- ${c}`) : [`(none)`]),
    ``,
    `## Last verification`,
    `- Result: ${h.lastVerification.result ?? "NOT_VERIFIED"} (fresh=${String(h.lastVerification.fresh)}) profile=${h.lastVerification.profile ?? "-"}`,
    ``,
    `## Next actions`,
    ...h.nextActions.map((c, i) => `${i + 1}. \`${c}\``),
    ``,
    h.checkpointRef ? `Checkpoint: \`${h.checkpointRef}\`` : `Checkpoint: (none yet)`,
    ``,
  ];
  return lines.join("\n");
}
