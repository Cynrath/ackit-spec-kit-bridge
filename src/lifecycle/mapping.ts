import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

export interface BridgeMapping {
  schemaVersion: number;
  featureDir: string | null;
  ackitTaskId: string | null;
  updatedAt: string;
}

const EMPTY: BridgeMapping = {
  schemaVersion: 1,
  featureDir: null,
  ackitTaskId: null,
  updatedAt: "",
};

export async function loadMapping(root: string): Promise<BridgeMapping> {
  const candidates = [
    join(root, ".ackit-spec-kit", "mapping.json"),
    join(root, ".ackit-spec-kit", "mapping.yml"),
  ];
  for (const p of candidates) {
    try {
      const raw = await readFile(p, "utf8");
      const parsed = p.endsWith(".json") ? JSON.parse(raw) : parseYaml(raw);
      if (parsed && typeof parsed === "object") {
        return {
          schemaVersion: 1,
          featureDir: (parsed as { featureDir?: string }).featureDir ?? null,
          ackitTaskId: (parsed as { ackitTaskId?: string }).ackitTaskId ?? null,
          updatedAt: (parsed as { updatedAt?: string }).updatedAt ?? "",
        };
      }
    } catch {
      // try next
    }
  }
  return { ...EMPTY };
}
