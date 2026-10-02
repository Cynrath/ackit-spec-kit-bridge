import { readFile } from "node:fs/promises";
import { join } from "node:path";

export interface StoredVerdict {
  schemaVersion: number;
  result: "PASS" | "FAIL" | "BLOCKED";
  profile: string;
  subjectDigest: string;
  evidenceDigest: string;
  feature: string | null;
  ackitTask: string | null;
  bridgeVersion: string;
  toolVersions: Record<string, string | null>;
  createdAt: string;
  reasonCodes: string[];
  summary: string;
}

export async function loadLatestVerdict(root: string): Promise<{
  verdict: StoredVerdict | null;
  path: string | null;
  error: string | null;
}> {
  const p = join(root, ".ackit-spec-kit", "verdicts", "latest.json");
  try {
    const raw = await readFile(p, "utf8");
    const parsed = JSON.parse(raw) as StoredVerdict;
    if (!parsed.subjectDigest || !parsed.result) {
      return { verdict: null, path: p, error: "malformed verdict file" };
    }
    return { verdict: parsed, path: p, error: null };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      return { verdict: null, path: null, error: null };
    }
    return { verdict: null, path: p, error: `unreadable verdict: ${(e as Error).message}` };
  }
}
