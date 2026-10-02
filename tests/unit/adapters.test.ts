import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveAckitState } from "../../src/adapters/ackit-state.js";
import { resolveSpecKitState } from "../../src/adapters/speckit.js";
import { loadMapping } from "../../src/lifecycle/mapping.js";

function tmp(): string {
  return mkdtempSync(join(tmpdir(), "bridge-ut-"));
}

describe("speckit adapter", () => {
  it("reports uninitialized when .specify missing", async () => {
    const st = await resolveSpecKitState(tmp());
    expect(st.initialized).toBe(false);
  });
  it("discovers numbered features, highest wins", async () => {
    const root = tmp();
    mkdirSync(join(root, ".specify", "memory"), { recursive: true });
    writeFileSync(
      join(root, ".specify", "integration.json"),
      JSON.stringify({ integration: "generic" }),
    );
    writeFileSync(join(root, ".specify", "memory", "constitution.md"), "# c");
    for (const d of ["001-a", "002-b"]) {
      mkdirSync(join(root, "specs", d), { recursive: true });
      writeFileSync(join(root, "specs", d, "spec.md"), "# spec");
    }
    writeFileSync(join(root, "specs", "002-b", "plan.md"), "# plan");
    writeFileSync(join(root, "specs", "002-b", "tasks.md"), "# tasks");
    const st = await resolveSpecKitState(root);
    expect(st.initialized).toBe(true);
    expect(st.activeFeature?.dirName).toBe("002-b");
    expect(st.activeFeature?.artifacts["spec.md"]).toContain("spec.md");
  });
  it("flags malformed integration.json", async () => {
    const root = tmp();
    mkdirSync(join(root, ".specify"), { recursive: true });
    writeFileSync(join(root, ".specify", "integration.json"), "{broken");
    const st = await resolveSpecKitState(root);
    expect(st.errors.join(" ")).toMatch(/malformed/);
  });
});

describe("ackit state + mapping", () => {
  it("finds tasks and mapping", async () => {
    const root = tmp();
    writeFileSync(join(root, "ackit.yml"), "schemaVersion: 1\n");
    mkdirSync(join(root, "docs", "tasks", "active"), { recursive: true });
    writeFileSync(
      join(root, "docs", "tasks", "active", "TASK-0001-demo.md"),
      "# TASK-0001 demo\nstatus: in-progress\n",
    );
    const st = await resolveAckitState(root, "TASK-0001");
    expect(st.initialized).toBe(true);
    expect(st.mappedTask?.id).toBe("TASK-0001");
    const m = await loadMapping(root);
    expect(m.featureDir).toBeNull();
  });
});
