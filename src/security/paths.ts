import { realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

export async function resolveContainedPath(
  root: string,
  candidate: string,
): Promise<string | null> {
  try {
    const rootReal = await realpath(root);
    const abs = isAbsolute(candidate) ? candidate : resolve(root, candidate);
    const absReal = await realpath(abs).catch(() => abs);
    const rel = relative(rootReal, absReal);
    if (rel === "" || (!rel.startsWith("..") && !isAbsolute(rel))) return absReal;
    // Allow the root itself and children; reject traversal.
    if (rel.split(sep)[0] === "..") return null;
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
