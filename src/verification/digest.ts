import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { canonicalJson } from "../util/json.js";

export interface DigestInput {
  name: string;
  digest: string;
}

export async function hashFileNormalized(absPath: string): Promise<string> {
  try {
    const st = await stat(absPath);
    if (st.isDirectory()) return `dir:${absPath.split(/[\\/]/).pop()}`;
    const buf = await readFile(absPath);
    const text = buf.toString("utf8").replace(/\r\n/g, "\n");
    return createHash("sha256").update(text, "utf8").digest("hex");
  } catch {
    return "missing";
  }
}

/** Build the canonical subject digest from ordered component digests. */
export function buildSubjectDigest(components: DigestInput[]): string {
  const sorted = [...components].sort((a, b) => (a.name < b.name ? -1 : 1));
  return createHash("sha256").update(canonicalJson(sorted), "utf8").digest("hex");
}

export function buildEvidenceDigest(manifest: unknown): string {
  return createHash("sha256").update(canonicalJson(manifest), "utf8").digest("hex");
}
