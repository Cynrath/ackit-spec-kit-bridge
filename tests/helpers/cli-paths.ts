import { execFileSync } from "node:child_process";

/**
 * Resolve the Spec Kit `specify` executable for tests: explicit SPECIFY_BIN
 * wins, otherwise rely on PATH (CI installs specify-cli via pip; local dev
 * uses `uv tool install specify-cli`). Never hardcode a machine-local path:
 * CI runners and contributor machines disagree on install locations.
 */
export function resolveSpecify(): string {
  const env = process.env["SPECIFY_BIN"];
  if (env) return env;
  return "specify";
}

export function specifyAvailable(): boolean {
  try {
    execFileSync(resolveSpecify(), ["--version"], { encoding: "utf8", timeout: 30_000 });
    return true;
  } catch {
    return false;
  }
}
