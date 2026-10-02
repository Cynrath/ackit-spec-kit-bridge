import { ackitRun, ackitVersion } from "../adapters/ackit.js";
import { specifyVersion } from "../adapters/speckit.js";
import { loadBridgeConfig } from "../config/loader.js";
import type { VerificationProfile } from "../config/schema.js";
import { redactSecrets } from "../security/redact.js";

export interface CheckResult {
  id: string;
  command: string;
  exitCode: number;
  status: "pass" | "fail" | "skip";
  summary: string;
  evidenceRef: string | null;
  startedAt: string;
  finishedAt: string;
}

export interface EvidenceEntry {
  checkId: string;
  kind: string;
  ref: string;
  digest: string;
  summary: string;
  redacted: boolean;
}

export async function runProfileChecks(
  root: string,
  profile: VerificationProfile,
): Promise<{ checks: CheckResult[]; evidence: EvidenceEntry[] }> {
  const checks: CheckResult[] = [];
  const evidence: EvidenceEntry[] = [];
  const { config } = await loadBridgeConfig(root);
  const ackitCmd = config.ackit.command;
  const specifyCmd = config.specKit.command;

  const push = async (
    id: string,
    command: string,
    fn: () => Promise<{ exitCode: number; summary: string; evidenceText: string }>,
    opts: { required: boolean } = { required: true },
  ) => {
    const startedAt = new Date().toISOString();
    try {
      const r = await fn();
      const status =
        r.exitCode === 0 ? "pass" : opts.required ? "fail" : r.exitCode === 3 ? "skip" : "fail";
      const red = redactSecrets(r.evidenceText.slice(0, 20_000));
      const { sha256Hex } = await import("../util/hash.js");
      const digest = sha256Hex(red.text);
      const ref = `evidence/${id}.txt`;
      checks.push({
        id,
        command,
        exitCode: r.exitCode,
        status: status as CheckResult["status"],
        summary: r.summary,
        evidenceRef: ref,
        startedAt,
        finishedAt: new Date().toISOString(),
      });
      evidence.push({
        checkId: id,
        kind: "command-output",
        ref,
        digest,
        summary: r.summary,
        redacted: red.redacted,
      });
    } catch (e) {
      checks.push({
        id,
        command,
        exitCode: 5,
        status: "fail",
        summary: `internal error: ${(e as Error).message}`,
        evidenceRef: null,
        startedAt,
        finishedAt: new Date().toISOString(),
      });
    }
  };

  // Quick profile checks (always included).
  await push("bridge-config", "bridge config validation", async () => {
    const loaded = await loadBridgeConfig(root);
    if (loaded.errors.length > 0)
      return {
        exitCode: 2,
        summary: loaded.errors.join("; "),
        evidenceText: loaded.errors.join("\n"),
      };
    return { exitCode: 0, summary: "bridge config valid", evidenceText: "bridge config valid" };
  });

  await push("ackit-config", "ackit config check", async () => {
    const r = await ackitRun({ command: ackitCmd, cwd: root }, ["config", "check"], 60_000);
    const ok = r.exitCode === 0;
    return {
      exitCode: ok ? 0 : 1,
      summary: ok
        ? "ackit config check passed"
        : `ackit config check failed: ${(r.stderr || r.stdout).slice(0, 500)}`,
      evidenceText: `${r.stdout}\n${r.stderr}`,
    };
  });

  await push("ackit-policy", "ackit policy check", async () => {
    const r = await ackitRun({ command: ackitCmd, cwd: root }, ["policy", "check"], 90_000);
    // policy check may exit non-zero when no policy configured; treat exit 0/1 as meaningful, others as fail.
    const ok = r.exitCode === 0;
    return {
      exitCode: r.exitCode,
      summary: ok ? "ackit policy check passed" : `ackit policy check exit ${r.exitCode}`,
      evidenceText: `${r.stdout}\n${r.stderr}`,
    };
  });

  await push("speckit-artifacts", "spec-kit artifact integrity", async () => {
    const { resolveSpecKitState } = await import("../adapters/speckit.js");
    const st = await resolveSpecKitState(root, specifyCmd);
    if (!st.initialized)
      return {
        exitCode: 1,
        summary: "spec-kit not initialized",
        evidenceText: st.errors.join("\n"),
      };
    if (!st.activeFeature)
      return {
        exitCode: 0,
        summary: "no active feature (READY)",
        evidenceText: "no active feature",
      };
    const missing = ["spec.md", "plan.md", "tasks.md"].filter(
      (a) => !st.activeFeature?.artifacts[a],
    );
    if (missing.length === 3)
      return {
        exitCode: 1,
        summary: "feature has no spec/plan/tasks",
        evidenceText: missing.join(","),
      };
    return {
      exitCode: 0,
      summary: `feature ${st.activeFeature.dirName} artifacts present`,
      evidenceText: JSON.stringify(st.activeFeature.artifacts),
    };
  });

  await push("mapping-integrity", "ackit task mapping integrity", async () => {
    const { loadMapping } = await import("../lifecycle/mapping.js");
    const { resolveAckitState } = await import("../adapters/ackit-state.js");
    const mapping = await loadMapping(root);
    if (!mapping.featureDir && !mapping.ackitTaskId)
      return {
        exitCode: 0,
        summary: "no mapping yet (sync required)",
        evidenceText: "empty mapping",
      };
    const ackitState = await resolveAckitState(root, mapping.ackitTaskId);
    if (mapping.ackitTaskId && !ackitState.mappedTask)
      return {
        exitCode: 1,
        summary: `mapped task ${mapping.ackitTaskId} missing`,
        evidenceText: ackitState.errors.join("\n"),
      };
    return { exitCode: 0, summary: "mapping integrity ok", evidenceText: JSON.stringify(mapping) };
  });

  if (profile === "quick") return { checks, evidence };

  // Standard additions.
  await push("ackit-scan", "ackit scan --ci", async () => {
    const r = await ackitRun({ command: ackitCmd, cwd: root }, ["scan", "--ci"], 180_000);
    return {
      exitCode: r.exitCode === 0 ? 0 : 1,
      summary: r.exitCode === 0 ? "ackit scan passed" : "ackit scan found blocking findings",
      evidenceText: `${r.stdout}\n${r.stderr}`.slice(0, 30_000),
    };
  });

  await push("typecheck", "tsc --noEmit", async () => {
    const { execFileSafe } = await import("../security/exec.js");
    const r = await execFileSafe("npx", ["--yes", "tsc", "-p", "tsconfig.json", "--noEmit"], {
      cwd: root,
      timeoutMs: 240_000,
    });
    return {
      exitCode: r.exitCode === 0 ? 0 : 1,
      summary: r.exitCode === 0 ? "typecheck passed" : "typecheck failed",
      evidenceText: `${r.stdout}\n${r.stderr}`.slice(0, 20_000),
    };
  });

  await push("unit-tests", "vitest run tests/unit", async () => {
    const { execFileSafe } = await import("../security/exec.js");
    const r = await execFileSafe("npx", ["--yes", "vitest", "run", "tests/unit"], {
      cwd: root,
      timeoutMs: 300_000,
    });
    return {
      exitCode: r.exitCode === 0 ? 0 : 1,
      summary: r.exitCode === 0 ? "unit tests passed" : "unit tests failed",
      evidenceText: `${r.stdout}\n${r.stderr}`.slice(0, 20_000),
    };
  });

  await push("tool-versions", "ackit/specify version probe", async () => {
    const av = await ackitVersion({ command: ackitCmd, cwd: root });
    const sv = await specifyVersion(specifyCmd, root);
    const ok = !!av && !!sv;
    return {
      exitCode: ok ? 0 : 1,
      summary: `ackit=${av ?? "missing"} specify=${sv ?? "missing"}`,
      evidenceText: `ackit=${av ?? "missing"} specify=${sv ?? "missing"}`,
    };
  });

  if (profile === "standard") return { checks, evidence };

  // High-risk additions: full test suite + security-focused probes.
  await push("full-tests", "vitest run (all)", async () => {
    const { execFileSafe } = await import("../security/exec.js");
    const r = await execFileSafe("npx", ["--yes", "vitest", "run"], {
      cwd: root,
      timeoutMs: 600_000,
    });
    return {
      exitCode: r.exitCode === 0 ? 0 : 1,
      summary: r.exitCode === 0 ? "full test suite passed" : "full test suite failed",
      evidenceText: `${r.stdout}\n${r.stderr}`.slice(0, 20_000),
    };
  });

  await push("build", "tsc build", async () => {
    const { execFileSafe } = await import("../security/exec.js");
    const r = await execFileSafe("npx", ["--yes", "tsc", "-p", "tsconfig.build.json"], {
      cwd: root,
      timeoutMs: 240_000,
    });
    return {
      exitCode: r.exitCode === 0 ? 0 : 1,
      summary: r.exitCode === 0 ? "build passed" : "build failed",
      evidenceText: `${r.stdout}\n${r.stderr}`.slice(0, 20_000),
    };
  });

  return { checks, evidence };
}
