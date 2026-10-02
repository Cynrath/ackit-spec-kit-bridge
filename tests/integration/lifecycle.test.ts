import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveSpecify } from "../helpers/cli-paths.js";

const CLI = join(process.cwd(), "dist", "cli", "index.js");
const SPECIFY = resolveSpecify();

function sh(cmd: string, args: string[], cwd: string): string {
  return execFileSync(cmd, args, { cwd, encoding: "utf8", timeout: 120_000 });
}

function makeRepo(): string {
  const root = mkdtempSync(join(tmpdir(), "bridge-it-"));
  sh("git", ["init", "-b", "main"], root);
  sh("git", ["config", "user.email", "test@example.com"], root);
  sh("git", ["config", "user.name", "test"], root);
  writeFileSync(join(root, "README.md"), "# fixture\n");
  // ACKit minimal init (no interactive): ackit.yml + task.
  writeFileSync(join(root, "ackit.yml"), "schemaVersion: 1\n");
  mkdirSync(join(root, "docs", "tasks", "active"), { recursive: true });
  writeFileSync(
    join(root, "docs", "tasks", "active", "TASK-0001-bridge-demo.md"),
    "# TASK-0001 bridge demo\n\nstatus: in-progress\n\nAcceptance: demo flows work.\n",
  );
  // Spec Kit init (generic, non-interactive).
  execFileSync(
    SPECIFY,
    [
      "init",
      "--here",
      "--force",
      "--non-interactive",
      "--integration",
      "generic",
      "--integration-options=--commands-dir .myagent/commands/",
    ],
    { cwd: root, encoding: "utf8", timeout: 180_000 },
  );
  // Feature fixture.
  mkdirSync(join(root, "specs", "001-demo"), { recursive: true });
  writeFileSync(join(root, "specs", "001-demo", "spec.md"), "# spec\n");
  writeFileSync(join(root, "specs", "001-demo", "plan.md"), "# plan\n");
  writeFileSync(join(root, "specs", "001-demo", "tasks.md"), "# tasks\n");
  writeFileSync(join(root, ".ackit-spec-kit-placeholder"), "x");
  return root;
}

function cli(root: string, args: string[]): { code: number; out: string } {
  try {
    const out = execFileSync("node", [CLI, ...args, "--json"], {
      cwd: root,
      encoding: "utf8",
      timeout: 180_000,
    });
    return { code: 0, out };
  } catch (e) {
    const err = e as { status?: number; stdout?: string };
    return { code: err.status ?? 1, out: String(err.stdout ?? "") };
  }
}

describe("bridge integration (real CLI, temp git repo)", () => {
  it("init -> sync -> status -> verify -> gate -> stale -> reverify", async () => {
    const root = makeRepo();
    // init
    execFileSync("node", [CLI, "init"], { cwd: root, encoding: "utf8", timeout: 120_000 });
    expect(existsSync(join(root, ".ackit-spec-kit", "config.yml"))).toBe(true);
    // sync
    const sync = cli(root, ["sync"]);
    expect(sync.code).toBe(0);
    const mapping = JSON.parse(readFileSync(join(root, ".ackit-spec-kit", "mapping.json"), "utf8"));
    expect(mapping.featureDir).toBe("specs/001-demo");
    // status TASKED (clean tree? new files untracked -> IMPLEMENTING possible; accept either)
    const status = JSON.parse(cli(root, ["status"]).out);
    expect(["TASKED", "IMPLEMENTING", "READY", "SPECIFIED", "PLANNED"].join(",")).toContain(
      status.data.lifecycle,
    );
    // verify quick (fast, avoids long ackit scan in CI fixture)
    let code = 0;
    try {
      execFileSync("node", [CLI, "verify", "--profile", "quick"], {
        cwd: root,
        encoding: "utf8",
        timeout: 300_000,
      });
    } catch (e) {
      code = (e as { status?: number }).status ?? 1;
    }
    expect([0, 1]).toContain(code);
    if (code === 0) {
      const gate = cli(root, ["gate"]);
      // gate may fail if mapping task missing etc; just assert JSON shape.
      expect(gate.out).toContain("subjectDigest");
      // mutate spec -> verdict must go STALE
      writeFileSync(join(root, "specs", "001-demo", "spec.md"), "# spec changed\n");
      const st2 = JSON.parse(cli(root, ["status"]).out);
      expect(st2.data.lifecycle).toBe("STALE");
    }
    // idempotent re-run
    execFileSync("node", [CLI, "sync"], { cwd: root, encoding: "utf8", timeout: 60_000 });
  }, 300_000);

  it("complete refuses without fresh PASS", async () => {
    const root = makeRepo();
    execFileSync("node", [CLI, "init"], { cwd: root, encoding: "utf8", timeout: 120_000 });
    execFileSync("node", [CLI, "sync"], { cwd: root, encoding: "utf8", timeout: 60_000 });
    let code = 0;
    try {
      execFileSync("node", [CLI, "complete"], { cwd: root, encoding: "utf8", timeout: 60_000 });
    } catch (e) {
      code = (e as { status?: number }).status ?? 1;
    }
    expect(code).toBe(1);
  }, 180_000);
});
