import { stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { ackitVersion } from "../adapters/ackit.js";
import { resolveAckitState } from "../adapters/ackit-state.js";
import { resolveGitState } from "../adapters/git.js";
import { resolveSpecKitState, specifyVersion } from "../adapters/speckit.js";
import { BRIDGE_VERSION } from "../compat.js";
import { loadBridgeConfig } from "../config/loader.js";
import { loadMapping } from "../lifecycle/mapping.js";
import { deriveLifecycle } from "../lifecycle/status.js";
import { computeSubjectDigest } from "../verification/subject.js";
import { loadLatestVerdict } from "../verification/verdict-store.js";

export interface BridgeContext {
  root: string;
  config: Awaited<ReturnType<typeof loadBridgeConfig>>["config"];
  configErrors: string[];
  configFound: boolean;
  speckit: Awaited<ReturnType<typeof resolveSpecKitState>>;
  ackit: Awaited<ReturnType<typeof resolveAckitState>>;
  mapping: Awaited<ReturnType<typeof loadMapping>>;
  git: Awaited<ReturnType<typeof resolveGitState>>;
  verdict: Awaited<ReturnType<typeof loadLatestVerdict>>["verdict"];
  verdictError: string | null;
  subjectDigest: string;
  subjectComponents: { name: string; digest: string }[];
  ackitVersion: string | null;
  speckitVersion: string | null;
  lifecycle: ReturnType<typeof deriveLifecycle>;
  blockedReason: string | null;
}

export async function loadContext(cwd: string, profile = "standard"): Promise<BridgeContext> {
  const root = await findRoot(cwd);
  const loaded = await loadBridgeConfig(root);
  const mapping = await loadMapping(root);
  const speckit = await resolveSpecKitState(root, loaded.config.specKit.command);
  const ackit = await resolveAckitState(root, mapping.ackitTaskId);
  const git = await resolveGitState(root);
  const { verdict, error } = await loadLatestVerdict(root);
  const ackitV = await ackitVersion({ command: loaded.config.ackit.command, cwd: root }).catch(
    () => null,
  );
  const speckitV = await specifyVersion(loaded.config.specKit.command, root).catch(() => null);

  const featureDirAbs = speckit.activeFeature?.dirPath ?? null;
  const subjectOpts = {
    featureDirAbs,
    ackitTaskPath: ackit.mappedTask?.path ?? null,
    ackitConfigPath: ackit.configPath,
    ackitPolicyPath: ackit.policyPath,
    constitutionPath: speckit.constitutionPath,
    profile,
    ackitVersion: ackitV,
    speckitVersion: speckitV,
    bridgeVersion: BRIDGE_VERSION,
  };
  let computed = await computeSubjectDigest(root, loaded.config, subjectOpts);
  // Freshness must compare apples to apples: a verdict recorded under profile
  // X is fresh only if the subject recomputed under X still matches. The
  // requested profile selects which checks to run; the stored verdict's
  // profile selects the comparison baseline.
  if (verdict && verdict.profile !== profile) {
    computed = await computeSubjectDigest(root, loaded.config, {
      ...subjectOpts,
      profile: verdict.profile,
    });
  }
  const { subjectDigest, components } = computed;

  let blockedReason: string | null = null;
  if (loaded.errors.length > 0) blockedReason = `CONFIG_INVALID: ${loaded.errors[0]}`;
  else if (error) blockedReason = `VERDICT_UNREADABLE`;
  else if (speckit.errors.some((e) => e.includes("malformed")))
    blockedReason = "SPECKIT_STATE_MALFORMED";
  else if (ackit.errors.length > 0) blockedReason = ackit.errors[0] ?? "MAPPING_INVALID";

  const verdictFresh =
    verdict && verdict.subjectDigest === subjectDigest ? true : verdict ? false : null;

  const lifecycle = deriveLifecycle({
    ackitInitialized: ackit.initialized,
    speckitInitialized: speckit.initialized,
    blockedReason,
    hasActiveFeature: !!speckit.activeFeature,
    hasSpec: !!speckit.activeFeature?.artifacts["spec.md"],
    hasPlan: !!speckit.activeFeature?.artifacts["plan.md"],
    hasTasks: !!speckit.activeFeature?.artifacts["tasks.md"],
    hasMapping: !!(mapping.featureDir && mapping.ackitTaskId),
    hasDiff: git.dirty,
    verdictResult: verdict?.result ?? null,
    verdictFresh,
    taskCompleted: ackit.mappedTask?.status === "completed",
  });

  return {
    root,
    config: loaded.config,
    configErrors: loaded.errors,
    configFound: loaded.found,
    speckit,
    ackit,
    mapping,
    git,
    verdict,
    verdictError: error,
    subjectDigest,
    subjectComponents: components,
    ackitVersion: ackitV,
    speckitVersion: speckitV,
    lifecycle,
    blockedReason,
  };
}

async function findRoot(cwd: string): Promise<string> {
  let dir = resolve(cwd);
  for (let i = 0; i < 12; i++) {
    try {
      const st = await stat(join(dir, ".git"));
      if (st.isDirectory() || st.isFile()) return dir;
    } catch {
      // continue
    }
    try {
      await stat(join(dir, ".ackit-spec-kit", "config.yml"));
      return dir;
    } catch {
      // continue
    }
    const parent = resolve(dir, "..");
    if (parent === dir) return resolve(cwd);
    dir = parent;
  }
  return resolve(cwd);
}
