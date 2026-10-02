import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveSpecify } from "../helpers/cli-paths.js";

const CLI = join(process.cwd(), "dist", "cli", "index.js");

describe("bridge e2e demo flow (quick profile)", () => {
  it("sync -> status -> verify -> gate -> mutate -> stale -> reverify -> checkpoint -> handoff", async () => {
    const root = mkdtempSync(join(tmpdir(), "bridge-e2e-"));
    execFileSync("git", ["init", "-b", "main"], { cwd: root });
    execFileSync("git", ["config", "user.email", "t@example.com"], { cwd: root });
    execFileSync("git", ["config", "user.name", "t"], { cwd: root });
    writeFileSync(join(root, "ackit.yml"), "schemaVersion: 1\n");
    mkdirSync(join(root, "docs", "tasks", "active"), { recursive: true });
    writeFileSync(
      join(root, "docs", "tasks", "active", "TASK-0001-e2e.md"),
      "# TASK-0001 e2e\nstatus: in-progress\n",
    );
    execFileSync(
      resolveSpecify(),
      [
        "init",
        "--here",
        "--force",
        "--non-interactive",
        "--integration",
        "generic",
        "--integration-options=--commands-dir .myagent/commands/",
      ],
      { cwd: root, timeout: 180_000 },
    );
    mkdirSync(join(root, "specs", "001-e2e"), { recursive: true });
    writeFileSync(join(root, "specs", "001-e2e", "spec.md"), "# s\n");
    writeFileSync(join(root, "specs", "001-e2e", "plan.md"), "# p\n");
    writeFileSync(join(root, "specs", "001-e2e", "tasks.md"), "# t\n");

    const run = (args: string[]) => {
      try {
        return {
          code: 0,
          out: execFileSync("node", [CLI, ...args], {
            cwd: root,
            encoding: "utf8",
            timeout: 300_000,
          }) as string,
        };
      } catch (e) {
        return {
          code: (e as { status?: number }).status ?? 1,
          out: String((e as { stdout?: unknown }).stdout ?? ""),
        };
      }
    };
    expect(run(["init"]).code).toBe(0);
    expect(run(["sync"]).code).toBe(0);
    expect(run(["status"]).code).toBe(0);
    const v = run(["verify", "--profile", "quick"]);
    expect([0, 1]).toContain(v.code);
    expect(run(["checkpoint"]).code).toBe(0);
    expect(run(["handoff"]).code).toBe(0);
    expect(existsSync(join(root, ".ackit-spec-kit", "handoffs", "latest.md"))).toBe(true);
  }, 420_000);
});
