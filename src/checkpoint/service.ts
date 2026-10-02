import { join } from "node:path";
import { redactObject } from "../security/redact.js";
import { atomicWriteFile } from "../util/fs.js";

export interface Checkpoint {
  schemaVersion: number;
  schema: "ackit.speckit.checkpoint.v1";
  id: string;
  createdAt: string;
  feature: string | null;
  ackitTask: string | null;
  lifecycleState: string;
  gitHead: string | null;
  dirtyDigest: string | null;
  subjectDigest: string | null;
  verification: { result: string | null; fresh: boolean | null; profile: string | null };
  blockers: string[];
  lastVerifiedCommands: string[];
  fileRefs: string[];
  nextCommands: string[];
}

export async function writeCheckpoint(root: string, cp: Checkpoint): Promise<string> {
  const { value } = redactObject(cp);
  const path = join(root, ".ackit-spec-kit", "checkpoints", `${cp.id}.json`);
  await atomicWriteFile(path, JSON.stringify(value, null, 2));
  return path;
}

export function checkpointId(now = new Date()): string {
  const s = now
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);
  return `CP-${s}`;
}
