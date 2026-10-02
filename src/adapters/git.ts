import { join } from "node:path";
import { execFileSafe } from "../security/exec.js";
import { sha256Hex } from "../util/hash.js";

export interface GitState {
  available: boolean;
  isRepo: boolean;
  head: string | null;
  branch: string | null;
  stagedDigest: string | null;
  unstagedDigest: string | null;
  untrackedDigest: string | null;
  dirty: boolean;
}

async function git(cwd: string, args: readonly string[]): Promise<string | null> {
  const r = await execFileSafe("git", args, { cwd, timeoutMs: 30_000 });
  if (r.exitCode !== 0) return null;
  return r.stdout.trim();
}

export async function resolveGitState(root: string): Promise<GitState> {
  const version = await git(root, ["--version"]);
  if (!version) {
    return {
      available: false,
      isRepo: false,
      head: null,
      branch: null,
      stagedDigest: null,
      unstagedDigest: null,
      untrackedDigest: null,
      dirty: false,
    };
  }
  const gitDir = await git(root, ["rev-parse", "--git-dir"]);
  if (!gitDir) {
    return {
      available: true,
      isRepo: false,
      head: null,
      branch: null,
      stagedDigest: null,
      unstagedDigest: null,
      untrackedDigest: null,
      dirty: false,
    };
  }
  // A fresh `git init` has no commits yet: rev-parse HEAD fails, but the
  // directory IS a repository. Report isRepo=true with null HEAD.
  const head = await git(root, ["rev-parse", "HEAD"]);
  const branch = await git(root, ["rev-parse", "--abbrev-ref", "HEAD"]);
  const staged = await git(root, ["diff", "--cached", "--no-color", "--no-ext-diff"]);
  const unstaged = await git(root, ["diff", "--no-color", "--no-ext-diff"]);
  const untrackedList = await git(root, ["ls-files", "--others", "--exclude-standard"]);
  const untrackedNames = (untrackedList ?? "")
    .split("\n")
    .map((s) => s.trim().replace(/\\/g, "/"))
    .filter(Boolean)
    .filter((n) => !isGeneratedBridgeState(n))
    .sort()
    .slice(0, 1000);
  // Names alone are not enough: in a no-commit tree every source file is
  // "untracked", so content edits would be invisible. Bind names to bounded
  // content hashes (large files contribute a stable marker, never raw bytes).
  const untrackedParts: string[] = [];
  for (const name of untrackedNames) {
    untrackedParts.push(`${name}:${await hashWorkFile(join(root, name))}`);
  }
  const stagedDigest = sha256Hex(normalizeDiff(staged ?? ""));
  const unstagedDigest = sha256Hex(normalizeDiff(unstaged ?? ""));
  const untrackedDigest = sha256Hex(untrackedParts.join("\n"));
  const dirty =
    (staged ?? "").length > 0 || (unstaged ?? "").length > 0 || untrackedNames.length > 0;
  return {
    available: true,
    isRepo: true,
    head,
    branch: branch === "HEAD" ? null : branch,
    stagedDigest,
    unstagedDigest,
    untrackedDigest,
    dirty,
  };
}

/** Normalize diffs so line-ending-only noise does not change digests. */
export function normalizeDiff(diff: string): string {
  return diff.replace(/\r\n/g, "\n").trim();
}

/** Generated bridge outputs must never self-invalidate a verdict via the
 * untracked layer (they are also gitignored, but this is belt-and-braces). */
function isGeneratedBridgeState(relPosix: string): boolean {
  return /^\.ackit-spec-kit\/(verdicts|bundles|evidence|checkpoints|handoffs|state)\//.test(
    relPosix,
  );
}

const MAX_WORK_FILE_BYTES = 1_000_000;

async function hashWorkFile(absPath: string): Promise<string> {
  try {
    const { stat, readFile } = await import("node:fs/promises");
    const st = await stat(absPath);
    if (!st.isFile()) return "non-file";
    if (st.size > MAX_WORK_FILE_BYTES) return `large:${st.size}`;
    const buf = await readFile(absPath);
    return sha256Hex(buf.toString("utf8").replace(/\r\n/g, "\n"));
  } catch {
    return "unreadable";
  }
}
