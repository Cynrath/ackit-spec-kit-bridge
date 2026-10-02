import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { execFileSafe } from "../security/exec.js";
import { readTextFile } from "../util/fs.js";

export interface SpecKitFeature {
  /** Directory name under specs/, e.g. "001-my-feature". */
  dirName: string;
  /** Absolute path of the feature directory. */
  dirPath: string;
  /** Repo-relative path of the feature directory. */
  relDir: string;
  artifacts: Record<string, string | null>;
}

export interface SpecKitState {
  initialized: boolean;
  root: string;
  integration: string | null;
  constitutionPath: string | null;
  activeFeature: SpecKitFeature | null;
  allFeatures: SpecKitFeature[];
  errors: string[];
}

const KNOWN_ARTIFACTS = [
  "spec.md",
  "plan.md",
  "tasks.md",
  "research.md",
  "data-model.md",
  "contracts",
  "quickstart.md",
  "checklist.md",
] as const;

/** Resolve active Spec Kit feature: highest-numbered dir under specs/ wins. */
export async function resolveSpecKitState(
  root: string,
  specifyCommand = "specify",
): Promise<SpecKitState> {
  const errors: string[] = [];
  const specifyDir = join(root, ".specify");
  const specsDir = join(root, "specs");
  let initialized = false;
  try {
    const st = await stat(specifyDir);
    initialized = st.isDirectory();
  } catch {
    initialized = false;
  }
  if (!initialized) {
    return {
      initialized: false,
      root,
      integration: null,
      constitutionPath: null,
      activeFeature: null,
      allFeatures: [],
      errors: ["spec-kit project not initialized (.specify/ missing)"],
    };
  }

  // Integration from .specify/integration.json (stable contract observed in 1.0.13).
  let integration: string | null = null;
  const integrationRaw = await readTextFile(join(specifyDir, "integration.json"), 64_000);
  if (integrationRaw) {
    try {
      const parsed = JSON.parse(integrationRaw) as {
        integration?: string;
        installed_integrations?: string[];
      };
      integration = parsed.integration ?? parsed.installed_integrations?.[0] ?? null;
    } catch {
      errors.push("malformed .specify/integration.json");
    }
  }

  // Constitution: .specify/memory/constitution.md is the stable location.
  let constitutionPath: string | null = null;
  for (const candidate of ["memory/constitution.md", "constitution.md"]) {
    try {
      const st = await stat(join(specifyDir, candidate));
      if (st.isFile()) {
        constitutionPath = join(specifyDir, candidate);
        break;
      }
    } catch {
      // continue
    }
  }

  // Feature dirs under specs/: numbered prefix wins, highest number = active.
  const allFeatures: SpecKitFeature[] = [];
  try {
    const entries = await readdir(specsDir, { withFileTypes: true });
    const dirs = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
    for (const dirName of dirs) {
      const dirPath = join(specsDir, dirName);
      const artifacts: Record<string, string | null> = {};
      for (const art of KNOWN_ARTIFACTS) {
        const p = join(dirPath, art);
        try {
          const st = await stat(p);
          artifacts[art] = st.isFile() || st.isDirectory() ? p : null;
        } catch {
          artifacts[art] = null;
        }
      }
      // Also capture checklists/ subdir.
      try {
        const st = await stat(join(dirPath, "checklists"));
        if (st.isDirectory()) artifacts["checklists/"] = join(dirPath, "checklists");
      } catch {
        // absent
      }
      allFeatures.push({
        dirName,
        dirPath,
        relDir: `specs/${dirName}`,
        artifacts,
      });
    }
  } catch {
    // specs/ may not exist yet — valid READY state.
  }

  const activeFeature = pickActiveFeature(allFeatures);
  void specifyCommand;
  return { initialized, root, integration, constitutionPath, activeFeature, allFeatures, errors };
}

function pickActiveFeature(features: SpecKitFeature[]): SpecKitFeature | null {
  if (features.length === 0) return null;
  const scored = features.map((f) => ({ f, n: leadingNumber(f.dirName) }));
  scored.sort((a, b) => b.n - a.n || (a.f.dirName < b.f.dirName ? 1 : -1));
  return (scored[0]?.f ?? null) as SpecKitFeature | null;
}

function leadingNumber(name: string): number {
  const m = name.match(/^(\d+)/);
  return m?.[1] ? Number.parseInt(m[1], 10) : -1;
}

export async function specifyVersion(specifyCommand: string, cwd: string): Promise<string | null> {
  const r = await execFileSafe(specifyCommand, ["--version"], { cwd, timeoutMs: 30_000 });
  if (r.exitCode !== 0) return null;
  const m = `${r.stdout}\n${r.stderr}`.match(/(\d+\.\d+\.\d+)/);
  return m?.[1] ?? null;
}

export async function readArtifactSafe(path: string, maxBytes = 500_000): Promise<string | null> {
  try {
    const buf = await readFile(path);
    return buf.subarray(0, maxBytes).toString("utf8");
  } catch {
    return null;
  }
}
