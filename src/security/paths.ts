import { realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

export async function resolveContainedPath(
  root: string,
  candidate: string,
): Promise<string | null> {
  try {
    // Anchor everything to the canonical root: CI tmpdirs often differ in
    // 8.3 short names, symlink prefixes, or letter case from their realpath,
    // so resolving the candidate against the unresolved root and comparing
    // with the resolved root yields false ".." escapes. Existing entries are
    // additionally resolved so in-tree symlinks pointing outside are rejected.
    const rootReal = await realpath(root);
    const anchored = isAbsolute(candidate) ? candidate : resolve(rootReal, candidate);
    const absReal = await realpath(anchored).catch(() => anchored);
    const rel = relative(rootReal, absReal);
    if (rel === "") return absReal;
    const parts = rel.split(sep);
    if (parts[0] === ".." || isAbsolute(rel)) return null;
    return absReal;
  } catch {
    return null;
  }
}

export function isRepoRelativePath(p: string): boolean {
  if (p.length === 0 || p.length > 1024) return false;
  if (p.includes("\0")) return false;
  if (isAbsolute(p)) return false;
  const parts = p.split(/[\\/]/);
  return !parts.includes("..");
}

export function toRepoRelative(root: string, abs: string): string {
  const rel = relative(root, abs).replace(/\\/g, "/");
  return rel === "" ? "." : rel;
}
