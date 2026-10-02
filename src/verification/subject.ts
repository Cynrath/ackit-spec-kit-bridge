import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { resolveGitState } from "../adapters/git.js";
import type { BridgeConfig } from "../config/schema.js";
import { normalizeVersion } from "../util/versions.js";
import { buildSubjectDigest, type DigestInput, hashFileNormalized } from "./digest.js";

export interface SubjectComputation {
  subjectDigest: string;
  components: DigestInput[];
}

export async function computeSubjectDigest(
  root: string,
  config: BridgeConfig,
  opts: {
    featureDirAbs: string | null;
    ackitTaskPath: string | null;
    ackitConfigPath: string | null;
    ackitPolicyPath: string | null;
    constitutionPath: string | null;
    profile: string;
    ackitVersion: string | null;
    speckitVersion: string | null;
    bridgeVersion: string;
  },
): Promise<SubjectComputation> {
  const components: DigestInput[] = [];
  const add = (name: string, digest: string) => components.push({ name, digest });

  // Spec Kit state
  if (opts.featureDirAbs) {
    for (const art of [
      "spec.md",
      "plan.md",
      "tasks.md",
      "research.md",
      "data-model.md",
      "quickstart.md",
    ]) {
      add(`speckit:${art}`, await hashFileNormalized(join(opts.featureDirAbs, art)));
    }
    // checklists dir: hash file list + contents
    try {
      const entries = await readdir(join(opts.featureDirAbs, "checklists"));
      entries.sort();
      const parts: string[] = [];
      for (const e of entries.slice(0, 50)) {
        parts.push(`${e}:${await hashFileNormalized(join(opts.featureDirAbs, "checklists", e))}`);
      }
      const { sha256Hex } = await import("../util/hash.js");
      add("speckit:checklists", sha256Hex(parts.join("\n")));
    } catch {
      add("speckit:checklists", "absent");
    }
  } else {
    add("speckit:feature", "absent");
  }
  add(
    "speckit:constitution",
    opts.constitutionPath ? await hashFileNormalized(opts.constitutionPath) : "absent",
  );
  try {
    const raw = await readFile(join(root, ".specify", "integration.json"), "utf8");
    const { sha256Hex } = await import("../util/hash.js");
    add("speckit:integration", sha256Hex(raw.replace(/\r\n/g, "\n")));
  } catch {
    add("speckit:integration", "absent");
  }

  // ACKit state
  add("ackit:task", opts.ackitTaskPath ? await hashFileNormalized(opts.ackitTaskPath) : "absent");
  add(
    "ackit:config",
    opts.ackitConfigPath ? await hashFileNormalized(opts.ackitConfigPath) : "absent",
  );
  add(
    "ackit:policy",
    opts.ackitPolicyPath ? await hashFileNormalized(opts.ackitPolicyPath) : "absent",
  );

  // Bridge state
  const { sha256Hex } = await import("../util/hash.js");
  const { canonicalJson } = await import("../util/json.js");
  add("bridge:config", sha256Hex(canonicalJson(config)));
  add("bridge:version", sha256Hex(opts.bridgeVersion));
  add("bridge:profile", sha256Hex(opts.profile));

  // Tool versions
  add(
    "tools:ackit",
    sha256Hex(opts.ackitVersion ? normalizeVersion(opts.ackitVersion) : "missing"),
  );
  add(
    "tools:speckit",
    sha256Hex(opts.speckitVersion ? normalizeVersion(opts.speckitVersion) : "missing"),
  );
  add("tools:node", sha256Hex(process.version));

  // Git state (HEAD + diff digests; branch as metadata hash too but documented as non-authoritative)
  const git = await resolveGitState(root);
  add("git:head", sha256Hex(git.head ?? "no-repo"));
  add("git:staged", git.stagedDigest ?? "absent");
  add("git:unstaged", git.unstagedDigest ?? "absent");
  add("git:untracked", git.untrackedDigest ?? "absent");

  return { subjectDigest: buildSubjectDigest(components), components };
}
