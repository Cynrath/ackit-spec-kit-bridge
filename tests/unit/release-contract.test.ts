import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { BRIDGE_VERSION } from "../../src/compat.js";

describe("published release contracts", () => {
  it("doctor JSON and human output use portable root/config labels", () => {
    const run = (args: string[]) =>
      spawnSync(process.execPath, ["dist/cli/index.js", "doctor", ...args], {
        encoding: "utf8",
        timeout: 30_000,
        windowsHide: true,
      });
    const json = run(["--json"]);
    expect([0, 3]).toContain(json.status);
    const data = JSON.parse(json.stdout) as {
      schema: string;
      data: { root: string; checks: { id: string; detail: string }[] };
    };
    expect(data.schema).toBe("ackit.speckit.doctor.v1");
    expect(data.data.root).toBe(".");
    expect(data.data.checks.find((check) => check.id === "ackit-init")?.detail).not.toContain(
      process.cwd(),
    );
    const human = run([]);
    expect([0, 3]).toContain(human.status);
    expect(human.stdout).not.toContain(process.cwd());
  });

  it("the actual built CLI and bundled extension/workflow identify the package version", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };
    const extension = parse(readFileSync("spec-kit/extension/extension.yml", "utf8")) as {
      extension: { version: string };
    };
    const workflow = parse(readFileSync("spec-kit/workflow/workflow.yml", "utf8")) as {
      workflow: { version: string };
    };
    const cli = execFileSync(process.execPath, ["dist/cli/index.js", "--version"], {
      encoding: "utf8",
      timeout: 30_000,
      windowsHide: true,
    }).trim();
    expect(cli).toBe(pkg.version);
    expect(BRIDGE_VERSION).toBe(pkg.version);
    expect(extension.extension.version).toBe(pkg.version);
    expect(workflow.workflow.version).toBe(pkg.version);
    expect(readFileSync("README.md", "utf8")).toContain(
      `@cynrath/ackit-spec-kit-bridge@${pkg.version}`,
    );
  });

  it.each([
    { registry: "absent", release: "absent", exit: 0, resume: "false" },
    { registry: "exists", release: "absent", exit: 0, resume: "true" },
    { registry: "exists", release: "exists", exit: 1, resume: undefined },
    { registry: "error", release: "absent", exit: 1, resume: undefined },
    { registry: "exists", release: "error", exit: 1, resume: undefined },
  ])("registry safety: $registry / release $release", (fixture) => {
    const workflow = parse(readFileSync(".github/workflows/release.yml", "utf8")) as {
      jobs: { release: { steps: { name?: string; run?: string }[] } };
    };
    const run = workflow.jobs.release.steps.find((step) =>
      step.name?.startsWith("Check registry state"),
    )?.run;
    if (!run) throw new Error("Release absence gate missing");
    const work = mkdtempSync(path.join(tmpdir(), "bridge-registry-gate-"));
    const bash =
      process.platform === "win32"
        ? path.resolve(
            execFileSync("git", ["--exec-path"], { encoding: "utf8", windowsHide: true }).trim(),
            "../../../bin/bash.exe",
          )
        : "bash";
    const stubs = String.raw`
npm() {
  if [ "$MOCK_REGISTRY" = exists ]; then printf '0.1.2\n'; return 0; fi
  if [ "$MOCK_REGISTRY" = absent ]; then printf 'npm error E404\n' >&2;
  else printf 'npm error E503 registry unavailable\n' >&2; fi
  return 1
}
gh() {
  if [ "$MOCK_RELEASE" = exists ]; then return 0; fi
  if [ "$MOCK_RELEASE" = absent ]; then printf 'release not found\n' >&2;
  else printf 'HTTP 503 service unavailable\n' >&2; fi
  return 1
}
sleep() { :; }
`;
    try {
      const result = spawnSync(bash, ["--noprofile", "--norc", "-c", `${stubs}\n${run}`], {
        cwd: work,
        encoding: "utf8",
        timeout: 15_000,
        windowsHide: true,
        env: {
          ...process.env,
          RELEASE_VERSION: "0.1.2",
          RELEASE_TAG: "v0.1.2",
          GITHUB_ENV: "github-env",
          MOCK_REGISTRY: fixture.registry,
          MOCK_RELEASE: fixture.release,
        },
      });
      expect(result.error).toBeUndefined();
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(fixture.exit);
      if (fixture.resume !== undefined)
        expect(readFileSync(path.join(work, "github-env"), "utf8")).toContain(
          `RESUME=${fixture.resume}`,
        );
    } finally {
      rmSync(work, { recursive: true, force: true });
    }
  });
});
