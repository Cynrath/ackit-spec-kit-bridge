import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { type BridgeConfig, BridgeConfigSchema } from "./schema.js";

export const CONFIG_REL_PATH = ".ackit-spec-kit/config.yml";

export interface ConfigLoadResult {
  found: boolean;
  path: string | null;
  config: BridgeConfig;
  errors: string[];
}

export async function loadBridgeConfig(root: string): Promise<ConfigLoadResult> {
  const path = join(root, CONFIG_REL_PATH);
  try {
    const raw = await readFile(path, "utf8");
    let parsed: unknown;
    try {
      parsed = parseYaml(raw);
    } catch (e) {
      return {
        found: true,
        path,
        config: BridgeConfigSchema.parse({ schemaVersion: 1 }),
        errors: [`config YAML parse error: ${(e as Error).message}`],
      };
    }
    const res = BridgeConfigSchema.safeParse(parsed);
    if (!res.success) {
      const errors = res.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`);
      return {
        found: true,
        path,
        config: BridgeConfigSchema.parse({ schemaVersion: 1 }),
        errors,
      };
    }
    return { found: true, path, config: res.data, errors: [] };
  } catch {
    return {
      found: false,
      path: null,
      config: BridgeConfigSchema.parse({ schemaVersion: 1 }),
      errors: [],
    };
  }
}
