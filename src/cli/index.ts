#!/usr/bin/env node
import { stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Command } from "commander";
import { ackitRun } from "../adapters/ackit.js";
import { checkpointId, writeCheckpoint } from "../checkpoint/service.js";
import { BRIDGE_VERSION, COMPAT, checkCompat } from "../compat.js";
import { loadBridgeConfig } from "../config/loader.js";
import type { VerificationProfile } from "../config/schema.js";
import { DEFAULT_CONFIG_YAML } from "../config/schema.js";
import { renderHandoffMarkdown } from "../handoff/renderer.js";
import { isRepoRelativePath } from "../security/paths.js";
import { redactObject, redactSecrets } from "../security/redact.js";
import { atomicWriteFile, ensureDir } from "../util/fs.js";
import { buildEvidenceDigest } from "../verification/digest.js";
import { evaluateGate, profileSatisfies } from "../verification/gate.js";
import { computeSubjectDigest } from "../verification/subject.js";
import { runProfileChecks } from "../verification/verifier.js";
import { loadContext } from "./context.js";
import {
  EXIT_ENV,
  EXIT_GATE_FAIL,
  EXIT_INTERNAL,
  EXIT_SECURITY,
  EXIT_SUCCESS,
  EXIT_USAGE,
} from "./exit-codes.js";
import { printJson } from "./output.js";

const program = new Command();
program
  .name("ackit-speckit")
  .description(
    "Community integration for ACKit and GitHub Spec Kit. Bridges Spec Kit intent artifacts into ACKit tasks, evidence, verification gates, and handoffs.",
  )
  .version(BRIDGE_VERSION, "--version")
  .option("--json", "machine-readable JSON output")
  .option("--root <path>", "repository root (default: cwd)");

function opts() {
  return program.opts<{ json?: boolean; root?: string }>();
}

function root(): string {
  return opts().root ?? process.cwd();
}

function asJson(): boolean {
  return !!opts().json;
}

function fail(code: number, message: string, reasonCodes: string[] = []): never {
  if (asJson() || code !== EXIT_USAGE) {
    printJson({
      schema: "ackit.speckit.error.v1",
      version: 1,
      data: { message, reasonCodes, exitCode: code },
    });
  } else {
    process.stderr.write(`error: ${message}\n`);
  }
  process.exit(code);
}

// ---------- init ----------

program
  .command("init")
  .description("Verify ACKit + Spec Kit, create bridge config/state, map active feature")
  .option("--dry-run", "report planned actions without writing", false)
  .option("--json", "machine-readable JSON output")
  .action(async (cmdOpts: { dryRun?: boolean; json?: boolean }) => {
    try {
      const r = root();
      const useJson = asJson() || !!cmdOpts.json;
      const ctx = await loadContext(r);
      const actions: string[] = [];
      const errors: string[] = [];

      if (!ctx.git.isRepo) errors.push("not a git repository (run git init first)");
      if (!ctx.ackit.initialized) errors.push("ACKit not initialized (run ackit init first)");
      if (!ctx.speckit.initialized)
        errors.push("Spec Kit not initialized (run specify init first)");

      if (!ctx.configFound) actions.push("create .ackit-spec-kit/config.yml");
      for (const d of ["state", "verdicts", "bundles", "checkpoints", "handoffs", "evidence"]) {
        try {
          await stat(join(r, ".ackit-spec-kit", d));
        } catch {
          actions.push(`create .ackit-spec-kit/${d}/`);
        }
      }
      if (ctx.speckit.activeFeature && !ctx.mapping.featureDir) {
        actions.push(
          `map feature ${ctx.speckit.activeFeature.dirName} -> ACKit task (creates .ackit-spec-kit/mapping.json)`,
        );
      }
      const extYml = join(r, "spec-kit", "extension", "extension.yml");
      try {
        await stat(extYml);
        actions.push(
          "extension source present (install with: specify extension add ackit --dev ./spec-kit/extension)",
        );
      } catch {
        // Advisory only: consumer repos consume the published extension, they
        // do not carry its source. Never block init on this.
        actions.push(
          "note: extension source not in this repo (install published ackit extension or use --dev with the bridge source)",
        );
      }

      if (cmdOpts.dryRun) {
        if (useJson)
          printJson({
            schema: "ackit.speckit.init.v1",
            version: 1,
            data: { dryRun: true, actions, errors },
          });
        else {
          process.stdout.write(`dry-run: ${actions.length} action(s)\n`);
          for (const a of actions) process.stdout.write(`  - ${a}\n`);
          if (errors.length > 0) {
            process.stdout.write(`blockers:\n`);
            for (const e of errors) process.stdout.write(`  ! ${e}\n`);
          }
        }
        process.exit(errors.length > 0 ? EXIT_ENV : EXIT_SUCCESS);
      }

      if (errors.length > 0) {
        if (useJson)
          printJson({ schema: "ackit.speckit.init.v1", version: 1, data: { actions: [], errors } });
        else for (const e of errors) process.stderr.write(`error: ${e}\n`);
        process.exit(EXIT_ENV);
      }

      // Write config if missing.
      try {
        await stat(join(r, ".ackit-spec-kit", "config.yml"));
      } catch {
        await ensureDir(join(r, ".ackit-spec-kit"));
        await atomicWriteFile(join(r, ".ackit-spec-kit", "config.yml"), DEFAULT_CONFIG_YAML);
      }
      for (const d of ["state", "verdicts", "bundles", "checkpoints", "handoffs", "evidence"]) {
        await ensureDir(join(r, ".ackit-spec-kit", d));
      }
      // Mapping: prefer existing, else active feature + best-effort task match.
      const { loadMapping } = await import("../lifecycle/mapping.js");
      const mapping = await loadMapping(r);
      if (ctx.speckit.activeFeature && !mapping.featureDir) {
        const guessed = ctx.ackit.tasks[0]?.id ?? null;
        const next = {
          schemaVersion: 1,
          featureDir: ctx.speckit.activeFeature.relDir,
          ackitTaskId: guessed,
          updatedAt: new Date().toISOString(),
        };
        await atomicWriteFile(
          join(r, ".ackit-spec-kit", "mapping.json"),
          JSON.stringify(next, null, 2),
        );
      }

      if (useJson)
        printJson({ schema: "ackit.speckit.init.v1", version: 1, data: { actions, errors: [] } });
      else {
        process.stdout.write(`initialized bridge in ${r}\n`);
        for (const a of actions) process.stdout.write(`  - ${a}\n`);
      }
      process.exit(EXIT_SUCCESS);
    } catch (e) {
      process.stderr.write(`internal: ${(e as Error).message}\n`);
      process.exit(EXIT_INTERNAL);
    }
  });

// ---------- doctor ----------

program
  .command("doctor")
  .description("Check Node, ACKit, Spec Kit, repo state, config, compatibility")
  .option("--json", "machine-readable JSON output")
  .action(async (cmdOpts: { json?: boolean }) => {
    try {
      const r = root();
      const useJson = asJson() || !!cmdOpts.json;
      const ctx = await loadContext(r);
      const compat = checkCompat({
        node: process.version,
        ackit: ctx.ackitVersion,
        speckit: ctx.speckitVersion,
      });
      const checks = [
        { id: "node", ok: compat[0]?.ok ?? false, detail: compat[0]?.detail ?? "" },
        {
          id: "ackit-cli",
          ok: !!ctx.ackitVersion,
          detail: `ackit ${ctx.ackitVersion ?? "missing"}`,
        },
        {
          id: "speckit-cli",
          ok: !!ctx.speckitVersion,
          detail: `specify ${ctx.speckitVersion ?? "missing"}`,
        },
        {
          id: "git",
          ok: ctx.git.available && ctx.git.isRepo,
          detail: ctx.git.head
            ? `HEAD ${ctx.git.head.slice(0, 12)}`
            : ctx.git.isRepo
              ? "repo (no commits yet)"
              : "no repo",
        },
        {
          id: "ackit-init",
          ok: ctx.ackit.initialized,
          detail: ctx.ackit.configPath ?? "ackit.yml missing",
        },
        {
          id: "speckit-init",
          ok: ctx.speckit.initialized,
          detail: ctx.speckit.integration
            ? `integration=${ctx.speckit.integration}`
            : "not initialized",
        },
        {
          id: "active-feature",
          ok: !!ctx.speckit.activeFeature,
          detail: ctx.speckit.activeFeature?.dirName ?? "none",
        },
        {
          id: "bridge-config",
          ok: ctx.configErrors.length === 0,
          detail: ctx.configFound ? "config.yml present" : "defaults (config.yml missing)",
        },
        {
          id: "mapping",
          ok: !!(ctx.mapping.featureDir && ctx.mapping.ackitTaskId),
          detail: ctx.mapping.ackitTaskId ?? "unmapped",
        },
        {
          id: "verdict-fresh",
          ok: ctx.verdict ? ctx.verdict.subjectDigest === ctx.subjectDigest : true,
          detail: ctx.verdict
            ? ctx.verdict.subjectDigest === ctx.subjectDigest
              ? "fresh"
              : "STALE"
            : "no verdict yet",
        },
      ];
      const failed = checks.filter(
        (c) =>
          !c.ok &&
          (c.id === "node" || c.id === "ackit-cli" || c.id === "speckit-cli" || c.id === "git"),
      );
      const payload = {
        schema: "ackit.speckit.doctor.v1",
        version: 1,
        data: {
          root: r,
          bridgeVersion: BRIDGE_VERSION,
          compat,
          checks,
          lifecycle: ctx.lifecycle.state,
        },
      };
      if (useJson) printJson(payload);
      else {
        for (const c of checks)
          process.stdout.write(`${c.ok ? "ok" : "fail"}  ${c.id}: ${c.detail}\n`);
        process.stdout.write(`lifecycle: ${ctx.lifecycle.state}\n`);
      }
      process.exit(failed.length > 0 ? EXIT_ENV : EXIT_SUCCESS);
    } catch (e) {
      process.stderr.write(`internal: ${(e as Error).message}\n`);
      process.exit(EXIT_INTERNAL);
    }
  });

// ---------- sync ----------

program
  .command("sync")
  .description("Sync active Spec Kit feature into ACKit task/ref lifecycle")
  .option("--dry-run", "report without writing", false)
  .option("--json", "machine-readable JSON output")
  .action(async (cmdOpts: { dryRun?: boolean; json?: boolean }) => {
    try {
      const r = root();
      const useJson = asJson() || !!cmdOpts.json;
      const ctx = await loadContext(r);
      if (!ctx.speckit.initialized)
        fail(EXIT_ENV, "spec-kit project not initialized", ["SPECKIT_NOT_INITIALIZED"]);
      if (!ctx.ackit.initialized)
        fail(EXIT_ENV, "ACKit not initialized", ["ACKIT_NOT_INITIALIZED"]);
      const feature = ctx.speckit.activeFeature;
      if (!feature) {
        if (useJson)
          printJson({
            schema: "ackit.speckit.sync.v1",
            version: 1,
            data: { synced: false, reason: "NO_ACTIVE_FEATURE" },
          });
        else process.stdout.write("no active Spec Kit feature; nothing to sync\n");
        process.exit(EXIT_SUCCESS);
      }
      if (!isRepoRelativePath(feature.relDir))
        fail(EXIT_SECURITY, "feature path escapes repository", ["PATH_TRAVERSAL"]);
      // Choose task: keep mapped task if still valid, else first active task, else none.
      let taskId = ctx.mapping.ackitTaskId;
      if (taskId && !ctx.ackit.tasks.some((t) => t.id === taskId)) taskId = null;
      if (!taskId) taskId = ctx.ackit.tasks[0]?.id ?? null;
      const next = {
        schemaVersion: 1,
        featureDir: feature.relDir,
        ackitTaskId: taskId,
        updatedAt: new Date().toISOString(),
      };
      const changed =
        next.featureDir !== ctx.mapping.featureDir || next.ackitTaskId !== ctx.mapping.ackitTaskId;
      if (cmdOpts.dryRun) {
        if (useJson)
          printJson({
            schema: "ackit.speckit.sync.v1",
            version: 1,
            data: { dryRun: true, changed, mapping: next, artifacts: feature.artifacts },
          });
        else
          process.stdout.write(
            `dry-run: would map ${feature.relDir} -> ${taskId ?? "(no task yet)"}\n`,
          );
        process.exit(EXIT_SUCCESS);
      }
      if (changed) {
        await atomicWriteFile(
          join(r, ".ackit-spec-kit", "mapping.json"),
          JSON.stringify(next, null, 2),
        );
      }
      if (useJson)
        printJson({
          schema: "ackit.speckit.sync.v1",
          version: 1,
          data: { synced: changed, mapping: next, artifacts: feature.artifacts },
        });
      else
        process.stdout.write(
          changed
            ? `synced ${feature.relDir} -> ${taskId ?? "(no task yet)"}\n`
            : `already in sync (${feature.relDir})\n`,
        );
      process.exit(EXIT_SUCCESS);
    } catch (e) {
      if (e instanceof Error && "code" in e) throw e;
      process.stderr.write(`internal: ${(e as Error).message}\n`);
      process.exit(EXIT_INTERNAL);
    }
  });

// ---------- status ----------

program
  .command("status")
  .description("Read-only canonical lifecycle status")
  .option("--json", "machine-readable JSON output")
  .action(async (cmdOpts: { json?: boolean }) => {
    try {
      const r = root();
      const useJson = asJson() || !!cmdOpts.json;
      const ctx = await loadContext(r);
      const verdictFresh = ctx.verdict ? ctx.verdict.subjectDigest === ctx.subjectDigest : null;
      const payload = {
        schema: "ackit.speckit.status.v1",
        version: 1,
        data: {
          lifecycle: ctx.lifecycle.state,
          reasonCodes: ctx.lifecycle.reasonCodes,
          feature: ctx.speckit.activeFeature?.relDir ?? null,
          ackitTask: ctx.mapping.ackitTaskId,
          artifacts: ctx.speckit.activeFeature?.artifacts ?? null,
          verdict: ctx.verdict
            ? { result: ctx.verdict.result, profile: ctx.verdict.profile, fresh: verdictFresh }
            : null,
          git: { head: ctx.git.head, branch: ctx.git.branch, dirty: ctx.git.dirty },
          subjectDigest: ctx.subjectDigest,
        },
      };
      if (useJson) printJson(payload);
      else {
        process.stdout.write(`lifecycle: ${ctx.lifecycle.state}\n`);
        process.stdout.write(`feature: ${ctx.speckit.activeFeature?.relDir ?? "(none)"}\n`);
        process.stdout.write(`task: ${ctx.mapping.ackitTaskId ?? "(unmapped)"}\n`);
        process.stdout.write(
          `verdict: ${ctx.verdict ? `${ctx.verdict.result} fresh=${String(verdictFresh)}` : "NOT_VERIFIED"}\n`,
        );
        process.stdout.write(`reasons: ${ctx.lifecycle.reasonCodes.join(", ")}\n`);
      }
      process.exit(EXIT_SUCCESS);
    } catch (e) {
      process.stderr.write(`internal: ${(e as Error).message}\n`);
      process.exit(EXIT_INTERNAL);
    }
  });

// ---------- verify ----------

program
  .command("verify")
  .description("Produce a state-bound verification bundle and verdict")
  .option("--profile <name>", "quick|standard|high-risk", "standard")
  .option("--json", "machine-readable JSON output")
  .action(async (cmdOpts: { profile?: string; json?: boolean }) => {
    try {
      const r = root();
      const useJson = asJson() || !!cmdOpts.json;
      const profile = (cmdOpts.profile ?? "standard") as VerificationProfile;
      if (!["quick", "standard", "high-risk"].includes(profile)) {
        fail(EXIT_USAGE, `unknown profile ${profile}`, ["UNKNOWN_PROFILE"]);
      }
      const ctx = await loadContext(r, profile);
      if (!ctx.speckit.initialized || !ctx.ackit.initialized) {
        fail(EXIT_ENV, "bridge not initialized (run init first)", ["NOT_INITIALIZED"]);
      }
      const { checks, evidence } = await runProfileChecks(r, profile);
      const failed = checks.filter((c) => c.status === "fail");
      const result = failed.length > 0 ? "FAIL" : "PASS";
      // Persist evidence texts (redacted) + bundle + verdict atomically.
      const { sha256Hex } = await import("../util/hash.js");
      await ensureDir(join(r, ".ackit-spec-kit", "evidence"));
      for (const ev of evidence) {
        const check = checks.find((c) => c.id === ev.checkId);
        void check;
      }
      const evidenceManifest = {
        schema: "ackit.speckit.evidence-manifest.v1",
        entries: [...evidence].sort((a, b) => (a.checkId < b.checkId ? -1 : 1)),
      };
      const evidenceDigest = buildEvidenceDigest(evidenceManifest);
      const { subjectDigest } = await computeSubjectDigest(r, ctx.config, {
        featureDirAbs: ctx.speckit.activeFeature?.dirPath ?? null,
        ackitTaskPath: ctx.ackit.mappedTask?.path ?? null,
        ackitConfigPath: ctx.ackit.configPath,
        ackitPolicyPath: ctx.ackit.policyPath,
        constitutionPath: ctx.speckit.constitutionPath,
        profile,
        ackitVersion: ctx.ackitVersion,
        speckitVersion: ctx.speckitVersion,
        bridgeVersion: BRIDGE_VERSION,
      });
      const now = new Date().toISOString();
      const reasonCodes =
        result === "PASS" ? ["ALL_CHECKS_PASSED"] : failed.map((f) => `CHECK_FAILED:${f.id}`);
      const bundle = {
        schema: "ackit.speckit.verification-bundle.v1",
        schemaVersion: 1,
        bridgeVersion: BRIDGE_VERSION,
        createdAt: now,
        profile,
        feature: ctx.speckit.activeFeature?.relDir ?? null,
        ackitTask: ctx.mapping.ackitTaskId,
        subjectDigest,
        evidenceDigest,
        toolVersions: {
          ackit: ctx.ackitVersion,
          specify: ctx.speckitVersion,
          node: process.version,
        },
        git: { head: ctx.git.head, branch: ctx.git.branch, dirty: ctx.git.dirty },
        artifacts: ctx.speckit.activeFeature?.artifacts
          ? Object.fromEntries(
              Object.entries(ctx.speckit.activeFeature.artifacts).map(([k, v]) => [
                k,
                v ? v.substring(r.length + 1).replace(/\\/g, "/") : null,
              ]),
            )
          : null,
        checks: [...checks].sort((a, b) => (a.id < b.id ? -1 : 1)),
        evidence: evidenceManifest.entries,
        verdictRef: "verdicts/latest.json",
        redaction: { enabled: true, count: 0 },
      };
      const verdict = {
        schema: "ackit.speckit.verdict.v1",
        schemaVersion: 1,
        result,
        profile,
        subjectDigest,
        evidenceDigest,
        feature: ctx.speckit.activeFeature?.relDir ?? null,
        ackitTask: ctx.mapping.ackitTaskId,
        bridgeVersion: BRIDGE_VERSION,
        toolVersions: {
          ackit: ctx.ackitVersion,
          specify: ctx.speckitVersion,
          node: process.version,
        },
        createdAt: now,
        reasonCodes,
        summary:
          result === "PASS" ? `PASS (${profile})` : `FAIL (${profile}): ${reasonCodes.join(", ")}`,
      };
      const { value: redactedBundle, redactedCount } = redactObject(bundle);
      (redactedBundle as { redaction: { enabled: boolean; count: number } }).redaction.count =
        redactedCount;
      const bundleDigestCheck = sha256Hex(JSON.stringify(redactedBundle));
      void bundleDigestCheck;
      await ensureDir(join(r, ".ackit-spec-kit", "bundles"));
      await ensureDir(join(r, ".ackit-spec-kit", "verdicts"));
      await atomicWriteFile(
        join(r, ".ackit-spec-kit", "bundles", `${subjectDigest.slice(0, 12)}.json`),
        JSON.stringify(redactedBundle, null, 2),
      );
      await atomicWriteFile(
        join(r, ".ackit-spec-kit", "verdicts", "latest.json"),
        JSON.stringify(verdict, null, 2),
      );
      if (useJson) {
        printJson({
          schema: "ackit.speckit.verify.v1",
          version: 1,
          data: { result, profile, subjectDigest, evidenceDigest, reasonCodes, checks },
        });
      } else {
        process.stdout.write(`verify (${profile}): ${result}\n`);
        process.stdout.write(`subject: ${subjectDigest.slice(0, 16)}…\n`);
        for (const c of checks) process.stdout.write(`  ${c.status} ${c.id}: ${c.summary}\n`);
      }
      process.exit(result === "PASS" ? EXIT_SUCCESS : EXIT_GATE_FAIL);
    } catch (e) {
      process.stderr.write(`internal: ${(e as Error).message}\n`);
      process.exit(EXIT_INTERNAL);
    }
  });

// ---------- gate ----------

program
  .command("gate")
  .description("Read-only completion gate check")
  .option("--profile <name>", "expected profile", "standard")
  .option("--json", "machine-readable JSON output")
  .action(async (cmdOpts: { profile?: string; json?: boolean }) => {
    try {
      const r = root();
      const useJson = asJson() || !!cmdOpts.json;
      const ctx = await loadContext(r);
      const verdictFresh = ctx.verdict ? ctx.verdict.subjectDigest === ctx.subjectDigest : null;
      const gate = evaluateGate({
        verdictResult: ctx.verdict?.result ?? null,
        verdictFresh,
        hasSpec: !!ctx.speckit.activeFeature?.artifacts["spec.md"],
        hasPlan: !!ctx.speckit.activeFeature?.artifacts["plan.md"],
        hasTasks: !!ctx.speckit.activeFeature?.artifacts["tasks.md"],
        hasMapping: !!(ctx.mapping.featureDir && ctx.mapping.ackitTaskId),
        blockingSecurity: false,
        profileChecksComplete: profileSatisfies(
          ctx.verdict?.profile ?? null,
          cmdOpts.profile ?? "standard",
        ),
      });
      if (useJson) {
        printJson({
          schema: "ackit.speckit.gate.v1",
          version: 1,
          data: {
            pass: gate.pass,
            reasonCodes: gate.reasonCodes,
            verdict: ctx.verdict
              ? { result: ctx.verdict.result, fresh: verdictFresh, profile: ctx.verdict.profile }
              : null,
            subjectDigest: ctx.subjectDigest,
          },
        });
      } else {
        process.stdout.write(`gate: ${gate.pass ? "PASS" : "FAIL"}\n`);
        process.stdout.write(`reasons: ${gate.reasonCodes.join(", ")}\n`);
      }
      process.exit(gate.pass ? EXIT_SUCCESS : EXIT_GATE_FAIL);
    } catch (e) {
      process.stderr.write(`internal: ${(e as Error).message}\n`);
      process.exit(EXIT_INTERNAL);
    }
  });

// ---------- checkpoint ----------

program
  .command("checkpoint")
  .description("Create a deterministic checkpoint for resume/handoff")
  .option("--json", "machine-readable JSON output")
  .option("--blockers <text>", "comma-separated open blockers", "")
  .action(async (cmdOpts: { json?: boolean; blockers?: string }) => {
    try {
      const r = root();
      const useJson = asJson() || !!cmdOpts.json;
      const ctx = await loadContext(r);
      const verdictFresh = ctx.verdict ? ctx.verdict.subjectDigest === ctx.subjectDigest : null;
      const blockers = (cmdOpts.blockers ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const id = checkpointId();
      const cp = {
        schemaVersion: 1 as const,
        schema: "ackit.speckit.checkpoint.v1" as const,
        id,
        createdAt: new Date().toISOString(),
        feature: ctx.speckit.activeFeature?.relDir ?? null,
        ackitTask: ctx.mapping.ackitTaskId,
        lifecycleState: ctx.lifecycle.state,
        gitHead: ctx.git.head,
        dirtyDigest: ctx.git.unstagedDigest,
        subjectDigest: ctx.subjectDigest,
        verification: {
          result: ctx.verdict?.result ?? null,
          fresh: verdictFresh,
          profile: ctx.verdict?.profile ?? null,
        },
        blockers,
        lastVerifiedCommands: ctx.verdict
          ? [`ackit-speckit verify --profile ${ctx.verdict.profile}`]
          : [],
        fileRefs: [
          ...(ctx.speckit.activeFeature ? [ctx.speckit.activeFeature.relDir] : []),
          ...(ctx.ackit.mappedTask ? [ctx.ackit.mappedTask.relPath] : []),
        ],
        nextCommands:
          ctx.lifecycle.state === "COMPLETE"
            ? []
            : [
                "ackit-speckit status",
                "ackit-speckit verify --profile standard",
                "ackit-speckit gate",
              ],
      };
      const path = await writeCheckpoint(r, cp);
      if (useJson) printJson({ schema: "ackit.speckit.checkpoint.v1", version: 1, data: cp });
      else process.stdout.write(`checkpoint ${id} -> ${path.substring(r.length + 1)}\n`);
      process.exit(EXIT_SUCCESS);
    } catch (e) {
      process.stderr.write(`internal: ${(e as Error).message}\n`);
      process.exit(EXIT_INTERNAL);
    }
  });

// ---------- handoff ----------

program
  .command("handoff")
  .description("Create a human/agent-readable handoff from canonical state")
  .option("--json", "machine-readable JSON output")
  .option("--format <fmt>", "markdown|json", "markdown")
  .option("--out <path>", "write to file instead of stdout")
  .action(async (cmdOpts: { json?: boolean; format?: string; out?: string }) => {
    try {
      const r = root();
      const useJson = asJson() || !!cmdOpts.json || cmdOpts.format === "json";
      const ctx = await loadContext(r);
      const verdictFresh = ctx.verdict ? ctx.verdict.subjectDigest === ctx.subjectDigest : null;
      const arts = ctx.speckit.activeFeature?.artifacts ?? {};
      const complete: string[] = [];
      const incomplete: string[] = [];
      if (arts["spec.md"]) complete.push("spec.md present");
      else incomplete.push("spec.md missing");
      if (arts["plan.md"]) complete.push("plan.md present");
      else incomplete.push("plan.md missing");
      if (arts["tasks.md"]) complete.push("tasks.md present");
      else incomplete.push("tasks.md missing");
      if (ctx.mapping.ackitTaskId) complete.push(`mapped to ${ctx.mapping.ackitTaskId}`);
      else incomplete.push("no ACKit task mapping (run sync)");
      if (ctx.verdict?.result === "PASS" && verdictFresh)
        complete.push(`fresh PASS verdict (${ctx.verdict.profile})`);
      else incomplete.push("no fresh PASS verdict (run verify)");
      const handoff = {
        schemaVersion: 1 as const,
        schema: "ackit.speckit.handoff.v1" as const,
        createdAt: new Date().toISOString(),
        goal: ctx.speckit.activeFeature
          ? `Deliver ${ctx.speckit.activeFeature.relDir}`
          : "Initialize Spec Kit feature and bridge mapping",
        lifecycleState: ctx.lifecycle.state,
        feature: ctx.speckit.activeFeature?.relDir ?? null,
        ackitTask: ctx.mapping.ackitTaskId,
        complete,
        incomplete,
        blockers: ctx.blockedReason ? [ctx.blockedReason] : [],
        lastVerification: {
          result: ctx.verdict?.result ?? null,
          fresh: verdictFresh,
          profile: ctx.verdict?.profile ?? null,
        },
        freshness:
          verdictFresh === true ? "FRESH" : verdictFresh === false ? "STALE" : "NOT_VERIFIED",
        nextActions:
          ctx.lifecycle.state === "COMPLETE"
            ? []
            : [
                "ackit-speckit sync",
                "ackit-speckit verify --profile standard",
                "ackit-speckit gate",
              ],
        checkpointRef: null as string | null,
        git: {
          head: ctx.git.head,
          branch: ctx.git.branch,
          dirty: ctx.git.dirty,
          isRepo: ctx.git.isRepo,
        },
      };
      const outPath = cmdOpts.out
        ? join(r, cmdOpts.out)
        : join(r, ".ackit-spec-kit", "handoffs", "latest.md");
      if (useJson) {
        const text = JSON.stringify(handoff, null, 2);
        if (cmdOpts.out) {
          await ensureDir(join(r, ".ackit-spec-kit", "handoffs"));
          await writeFile(join(r, cmdOpts.out), text, "utf8");
          process.stdout.write(`handoff json -> ${cmdOpts.out}\n`);
        } else {
          process.stdout.write(`${text}\n`);
        }
      } else {
        const md = renderHandoffMarkdown(handoff);
        if (cmdOpts.out) {
          await ensureDir(join(r, ".ackit-spec-kit", "handoffs"));
          await writeFile(join(r, cmdOpts.out), md, "utf8");
          process.stdout.write(`handoff markdown -> ${cmdOpts.out}\n`);
        } else {
          await ensureDir(join(r, ".ackit-spec-kit", "handoffs"));
          await atomicWriteFile(outPath, md);
          process.stdout.write(md);
        }
      }
      process.exit(EXIT_SUCCESS);
    } catch (e) {
      process.stderr.write(`internal: ${(e as Error).message}\n`);
      process.exit(EXIT_INTERNAL);
    }
  });

// ---------- complete ----------

program
  .command("complete")
  .description("Safe completion: gate first, then ACKit task completion")
  .option("--profile <name>", "required verification profile", "standard")
  .option("--json", "machine-readable JSON output")
  .action(async (cmdOpts: { json?: boolean; profile?: string }) => {
    try {
      const r = root();
      const useJson = asJson() || !!cmdOpts.json;
      const expectedProfile = cmdOpts.profile ?? "standard";
      const ctx = await loadContext(r);
      const verdictFresh = ctx.verdict ? ctx.verdict.subjectDigest === ctx.subjectDigest : null;
      const gate = evaluateGate({
        verdictResult: ctx.verdict?.result ?? null,
        verdictFresh,
        hasSpec: !!ctx.speckit.activeFeature?.artifacts["spec.md"],
        hasPlan: !!ctx.speckit.activeFeature?.artifacts["plan.md"],
        hasTasks: !!ctx.speckit.activeFeature?.artifacts["tasks.md"],
        hasMapping: !!(ctx.mapping.featureDir && ctx.mapping.ackitTaskId),
        blockingSecurity: false,
        profileChecksComplete: profileSatisfies(ctx.verdict?.profile ?? null, expectedProfile),
      });
      if (!gate.pass) {
        if (useJson)
          printJson({
            schema: "ackit.speckit.complete.v1",
            version: 1,
            data: { completed: false, reasonCodes: gate.reasonCodes },
          });
        else process.stdout.write(`complete refused: ${gate.reasonCodes.join(", ")}\n`);
        process.exit(EXIT_GATE_FAIL);
      }
      if (!ctx.mapping.ackitTaskId) fail(EXIT_USAGE, "no mapped ACKit task", ["MAPPING_MISSING"]);
      // Delegate to ACKit task completion (stable CLI contract).
      const res = await ackitRun(
        { command: ctx.config.ackit.command, cwd: r },
        ["task", "complete", ctx.mapping.ackitTaskId as string],
        60_000,
      );
      if (res.exitCode !== 0) {
        const msg = redactSecrets(`${res.stdout}\n${res.stderr}`.slice(0, 2000)).text;
        if (useJson)
          printJson({
            schema: "ackit.speckit.complete.v1",
            version: 1,
            data: { completed: false, reasonCodes: ["ACKIT_COMPLETE_FAILED"], detail: msg },
          });
        else process.stdout.write(`ackit task complete failed: ${msg}\n`);
        process.exit(EXIT_GATE_FAIL);
      }
      // Persist completion evidence.
      await ensureDir(join(r, ".ackit-spec-kit", "state"));
      await atomicWriteFile(
        join(r, ".ackit-spec-kit", "state", "completion.json"),
        JSON.stringify(
          {
            schema: "ackit.speckit.completion.v1",
            task: ctx.mapping.ackitTaskId,
            feature: ctx.speckit.activeFeature?.relDir ?? null,
            subjectDigest: ctx.subjectDigest,
            at: new Date().toISOString(),
          },
          null,
          2,
        ),
      );
      if (useJson)
        printJson({
          schema: "ackit.speckit.complete.v1",
          version: 1,
          data: { completed: true, task: ctx.mapping.ackitTaskId, reasonCodes: ["COMPLETED"] },
        });
      else process.stdout.write(`completed ${ctx.mapping.ackitTaskId}\n`);
      process.exit(EXIT_SUCCESS);
    } catch (e) {
      process.stderr.write(`internal: ${(e as Error).message}\n`);
      process.exit(EXIT_INTERNAL);
    }
  });

// ---------- explain ----------

program
  .command("explain")
  .description("Explain lifecycle derivation and gate provenance")
  .option("--json", "machine-readable JSON output")
  .action(async (cmdOpts: { json?: boolean }) => {
    try {
      const r = root();
      const useJson = asJson() || !!cmdOpts.json;
      const ctx = await loadContext(r);
      const verdictFresh = ctx.verdict ? ctx.verdict.subjectDigest === ctx.subjectDigest : null;
      const data = {
        lifecycle: ctx.lifecycle.state,
        reasonCodes: ctx.lifecycle.reasonCodes,
        specKitFiles: {
          constitution:
            ctx.speckit.constitutionPath?.substring(r.length + 1).replace(/\\/g, "/") ?? null,
          feature: ctx.speckit.activeFeature?.relDir ?? null,
          artifacts: ctx.speckit.activeFeature?.artifacts
            ? Object.fromEntries(
                Object.entries(ctx.speckit.activeFeature.artifacts).map(([k, v]) => [
                  k,
                  v ? v.substring(r.length + 1).replace(/\\/g, "/") : null,
                ]),
              )
            : null,
        },
        ackitTask: ctx.ackit.mappedTask
          ? { id: ctx.ackit.mappedTask.id, path: ctx.ackit.mappedTask.relPath }
          : null,
        policies: {
          ackitConfig: ctx.ackit.configPath?.substring(r.length + 1).replace(/\\/g, "/") ?? null,
          ackitPolicy: ctx.ackit.policyPath?.substring(r.length + 1).replace(/\\/g, "/") ?? null,
          bridgeConfig: ctx.configFound ? ".ackit-spec-kit/config.yml" : null,
        },
        freshness: {
          subjectDigest: ctx.subjectDigest,
          verdictDigest: ctx.verdict?.subjectDigest ?? null,
          fresh: verdictFresh,
          staleBecause:
            verdictFresh === false
              ? "subject digest changed since verdict (spec/plan/tasks, ACKit task/config/policy, bridge config/profile, tool versions, or git diff changed)"
              : null,
        },
        blockers: ctx.blockedReason ? [ctx.blockedReason] : [],
        subjectComponents: ctx.subjectComponents,
      };
      if (useJson) printJson({ schema: "ackit.speckit.explain.v1", version: 1, data });
      else {
        process.stdout.write(
          `state: ${ctx.lifecycle.state} (${ctx.lifecycle.reasonCodes.join(", ")})\n`,
        );
        process.stdout.write(`feature files: ${JSON.stringify(data.specKitFiles.artifacts)}\n`);
        process.stdout.write(`task: ${data.ackitTask?.id ?? "(none)"}\n`);
        process.stdout.write(
          `freshness: ${verdictFresh === true ? "FRESH" : verdictFresh === false ? "STALE" : "NOT_VERIFIED"}\n`,
        );
        if (verdictFresh === false)
          process.stdout.write(`stale because: ${data.freshness.staleBecause}\n`);
      }
      process.exit(EXIT_SUCCESS);
    } catch (e) {
      process.stderr.write(`internal: ${(e as Error).message}\n`);
      process.exit(EXIT_INTERNAL);
    }
  });

// ---------- version ----------

program
  .command("version")
  .description("Print bridge + compatibility versions")
  .option("--json", "machine-readable JSON output")
  .action(async (cmdOpts: { json?: boolean }) => {
    const useJson = asJson() || !!cmdOpts.json;
    const loaded = await loadBridgeConfig(root()).catch(() => null);
    void loaded;
    const data = {
      bridge: BRIDGE_VERSION,
      node: process.version,
      compat: COMPAT,
    };
    if (useJson) printJson({ schema: "ackit.speckit.version.v1", version: 1, data });
    else process.stdout.write(`ackit-speckit ${BRIDGE_VERSION} (node ${process.version})\n`);
    process.exit(EXIT_SUCCESS);
  });

program.configureHelp({ sortSubcommands: true });

program.parseAsync(process.argv).catch((e: Error) => {
  process.stderr.write(`internal: ${e.message}\n`);
  process.exit(EXIT_INTERNAL);
});
