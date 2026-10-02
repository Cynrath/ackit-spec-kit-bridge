import { describe, expect, it } from "vitest";
import { EXIT_GATE_FAIL, EXIT_SUCCESS, EXIT_USAGE } from "../../src/cli/exit-codes.js";
import { checkCompat } from "../../src/compat.js";
import { BridgeConfigSchema } from "../../src/config/schema.js";
import { deriveLifecycle } from "../../src/lifecycle/status.js";
import { isRepoRelativePath } from "../../src/security/paths.js";
import { redactObject, redactSecrets } from "../../src/security/redact.js";
import { sha256Hex } from "../../src/util/hash.js";
import { canonicalJson } from "../../src/util/json.js";
import { compareVersions, normalizeVersion, satisfiesMinimum } from "../../src/util/versions.js";
import { buildEvidenceDigest, buildSubjectDigest } from "../../src/verification/digest.js";
import { evaluateGate, profileSatisfies } from "../../src/verification/gate.js";

describe("config schema", () => {
  it("accepts defaults", () => {
    const c = BridgeConfigSchema.parse({ schemaVersion: 1 });
    expect(c.verification.defaultProfile).toBe("standard");
  });
  it("rejects bad profile", () => {
    expect(() =>
      BridgeConfigSchema.parse({ schemaVersion: 1, verification: { defaultProfile: "nope" } }),
    ).toThrow();
  });
});

describe("canonical json + hashing", () => {
  it("sorts keys deterministically", () => {
    expect(canonicalJson({ b: 1, a: 2 })).toBe(canonicalJson({ a: 2, b: 1 }));
  });
  it("sha256 is stable", () => {
    expect(sha256Hex("abc")).toBe(sha256Hex("abc"));
    expect(sha256Hex("abc")).toHaveLength(64);
  });
  it("subject digest is order-insensitive", () => {
    const a = buildSubjectDigest([
      { name: "b", digest: "x" },
      { name: "a", digest: "y" },
    ]);
    const b = buildSubjectDigest([
      { name: "a", digest: "y" },
      { name: "b", digest: "x" },
    ]);
    expect(a).toBe(b);
  });
  it("evidence digest is stable", () => {
    expect(buildEvidenceDigest({ x: [1, 2] })).toBe(buildEvidenceDigest({ x: [1, 2] }));
  });
});

describe("lifecycle derivation", () => {
  const base = {
    ackitInitialized: true,
    speckitInitialized: true,
    blockedReason: null as string | null,
    hasActiveFeature: true,
    hasSpec: true,
    hasPlan: true,
    hasTasks: true,
    hasMapping: true,
    hasDiff: false,
    verdictResult: null as null | "PASS" | "FAIL" | "BLOCKED",
    verdictFresh: null as boolean | null,
    taskCompleted: false,
  };
  it("UNINITIALIZED when ackit missing", () => {
    expect(deriveLifecycle({ ...base, ackitInitialized: false }).state).toBe("UNINITIALIZED");
  });
  it("READY without feature", () => {
    expect(deriveLifecycle({ ...base, hasActiveFeature: false }).state).toBe("READY");
  });
  it("SPECIFIED without plan", () => {
    expect(deriveLifecycle({ ...base, hasPlan: false }).state).toBe("SPECIFIED");
  });
  it("PLANNED without tasks", () => {
    expect(deriveLifecycle({ ...base, hasTasks: false }).state).toBe("PLANNED");
  });
  it("TASKED with mapping and no diff", () => {
    expect(deriveLifecycle(base).state).toBe("TASKED");
  });
  it("IMPLEMENTING with diff", () => {
    expect(deriveLifecycle({ ...base, hasDiff: true }).state).toBe("IMPLEMENTING");
  });
  it("VERIFIED on fresh PASS", () => {
    expect(deriveLifecycle({ ...base, verdictResult: "PASS", verdictFresh: true }).state).toBe(
      "VERIFIED",
    );
  });
  it("STALE on stale verdict", () => {
    expect(deriveLifecycle({ ...base, verdictResult: "PASS", verdictFresh: false }).state).toBe(
      "STALE",
    );
  });
  it("BLOCKED wins", () => {
    expect(deriveLifecycle({ ...base, blockedReason: "X" }).state).toBe("BLOCKED");
  });
  it("COMPLETE requires completed task + fresh PASS", () => {
    expect(
      deriveLifecycle({ ...base, verdictResult: "PASS", verdictFresh: true, taskCompleted: true })
        .state,
    ).toBe("COMPLETE");
  });
});

describe("gate", () => {
  it("passes on fresh PASS with all artifacts", () => {
    const g = evaluateGate({
      verdictResult: "PASS",
      verdictFresh: true,
      hasSpec: true,
      hasPlan: true,
      hasTasks: true,
      hasMapping: true,
      blockingSecurity: false,
      profileChecksComplete: true,
    });
    expect(g.pass).toBe(true);
  });
  it("fails when stale", () => {
    const g = evaluateGate({
      verdictResult: "PASS",
      verdictFresh: false,
      hasSpec: true,
      hasPlan: true,
      hasTasks: true,
      hasMapping: true,
      blockingSecurity: false,
      profileChecksComplete: true,
    });
    expect(g.pass).toBe(false);
    expect(g.reasonCodes).toContain("VERDICT_STALE");
  });
  it("fails when not verified", () => {
    expect(
      evaluateGate({
        verdictResult: null,
        verdictFresh: null,
        hasSpec: true,
        hasPlan: true,
        hasTasks: true,
        hasMapping: true,
        blockingSecurity: false,
        profileChecksComplete: true,
      }).pass,
    ).toBe(false);
  });
  it("fails with CHECKS_INCOMPLETE on weaker profile", () => {
    const g = evaluateGate({
      verdictResult: "PASS",
      verdictFresh: true,
      hasSpec: true,
      hasPlan: true,
      hasTasks: true,
      hasMapping: true,
      blockingSecurity: false,
      profileChecksComplete: false,
    });
    expect(g.pass).toBe(false);
    expect(g.reasonCodes).toContain("CHECKS_INCOMPLETE");
  });
});

describe("profile hierarchy", () => {
  it("quick does not satisfy standard; standard satisfies standard", () => {
    expect(profileSatisfies("quick", "standard")).toBe(false);
    expect(profileSatisfies("standard", "standard")).toBe(true);
    expect(profileSatisfies("high-risk", "standard")).toBe(true);
    expect(profileSatisfies(null, "standard")).toBe(false);
  });
});

describe("redaction", () => {
  it("redacts github tokens", () => {
    const r = redactSecrets("token ghp_abcdefghijklmnop123456");
    expect(r.redacted).toBe(true);
    expect(r.text).not.toContain("ghp_");
  });
  it("redacts private keys", () => {
    const key = "-----BEGIN PRIVATE KEY-----\nABC\n-----END PRIVATE KEY-----";
    expect(redactSecrets(key).redacted).toBe(true);
  });
  it("redacts object secret keys", () => {
    const { value, redactedCount } = redactObject({ token: "abc", nested: { password: "x" } });
    expect(redactedCount).toBeGreaterThan(0);
    expect(JSON.stringify(value)).not.toContain("abc");
  });
});

describe("paths", () => {
  it("rejects traversal", () => {
    expect(isRepoRelativePath("../evil")).toBe(false);
    expect(isRepoRelativePath("/abs")).toBe(false);
    expect(isRepoRelativePath("specs/001-ok")).toBe(true);
  });
});

describe("versions + exit codes", () => {
  it("compares semver", () => {
    expect(compareVersions("1.0.13", "1.0.0")).toBe(1);
    expect(normalizeVersion("specify 1.0.13")).toBe("1.0.13");
    expect(satisfiesMinimum("0.5.4", "0.5.0")).toBe(true);
  });
  it("exit codes are stable", () => {
    expect(EXIT_SUCCESS).toBe(0);
    expect(EXIT_GATE_FAIL).toBe(1);
    expect(EXIT_USAGE).toBe(2);
  });
  it("compat flags old ackit", () => {
    const c = checkCompat({ node: "v24.0.0", ackit: "0.4.0", speckit: "1.0.13" });
    expect(c.find((x) => x.id === "ackit-version")?.ok).toBe(false);
  });
});
