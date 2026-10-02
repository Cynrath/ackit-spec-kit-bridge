import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { execFileSafe, quoteCmdArg } from "../../src/security/exec.js";
import { isRepoRelativePath, resolveContainedPath } from "../../src/security/paths.js";
import { redactSecrets } from "../../src/security/redact.js";

describe("security boundaries", () => {
  it("rejects path traversal outside repo", async () => {
    const root = mkdtempSync(join(tmpdir(), "bridge-sec-"));
    expect(await resolveContainedPath(root, "../evil.txt")).toBeNull();
    expect(await resolveContainedPath(root, "specs/001-ok")).not.toBeNull();
    expect(isRepoRelativePath("..\\evil")).toBe(false);
    expect(isRepoRelativePath("specs/001 ok/sp ace.md")).toBe(true);
  });

  it("never interpolates untrusted values into shell strings", async () => {
    // Argument arrays with shell:false: a malicious feature name must not execute.
    const evil = "$(touch pwned)";
    const r = await execFileSafe("node", ["-e", "console.log(process.argv[1])", evil], {
      cwd: tmpdir(),
      timeoutMs: 15_000,
    });
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain(evil);
  });

  it("reports missing commands as notFound instead of crashing", async () => {
    const r = await execFileSafe("definitely-not-a-real-command-xyz", ["--version"], {
      cwd: tmpdir(),
      timeoutMs: 15_000,
    });
    expect(r.notFound).toBe(true);
    expect(r.exitCode).toBe(127);
  });

  it("quotes cmd args so metacharacters stay literal", () => {
    expect(quoteCmdArg("standard")).toBe("standard");
    expect(quoteCmdArg("a&b|c")).toBe('"a&b|c"');
    expect(quoteCmdArg("100%")).toBe('"100%%"');
  });

  it("redacts secrets in evidence text", () => {
    const raw = "deploy token=ghp_ABCDEFGHIJKLMNOP123456 done";
    const r = redactSecrets(raw);
    expect(r.redacted).toBe(true);
    expect(r.text).not.toContain("ghp_");
    expect(r.text).toContain("[REDACTED]");
  });

  it("redacts private key blocks", () => {
    const raw = "-----BEGIN RSA PRIVATE KEY-----\nMIIB\n-----END RSA PRIVATE KEY-----";
    expect(redactSecrets(raw).redacted).toBe(true);
  });

  it("unicode + spaces in paths are contained", async () => {
    const root = mkdtempSync(join(tmpdir(), "bridge-üni-"));
    const p = join(root, "specs", "001 ünicode dir");
    const { mkdirSync } = await import("node:fs");
    mkdirSync(p, { recursive: true });
    writeFileSync(join(p, "spec.md"), "# ü\n");
    expect(await resolveContainedPath(root, "specs/001 ünicode dir/spec.md")).not.toBeNull();
  });
});
