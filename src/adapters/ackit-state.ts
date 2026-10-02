import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

export interface AckitTaskRef {
  id: string;
  path: string;
  relPath: string;
  title: string;
  status: string;
}

export interface AckitState {
  initialized: boolean;
  configPath: string | null;
  tasks: AckitTaskRef[];
  mappedTask: AckitTaskRef | null;
  policyPath: string | null;
  errors: string[];
}

/** Discover ACKit tasks under docs/tasks/active (ACKit task-first convention). */
export async function resolveAckitState(
  root: string,
  preferredTaskId: string | null,
): Promise<AckitState> {
  const errors: string[] = [];
  let configPath: string | null = null;
  for (const cand of ["ackit.yml", ".ackit/config.yml"]) {
    try {
      await readFile(join(root, cand));
      configPath = join(root, cand);
      break;
    } catch {
      // continue
    }
  }
  const initialized = configPath !== null;
  const tasks: AckitTaskRef[] = [];
  const activeDir = join(root, "docs", "tasks", "active");
  try {
    const entries = await readdir(activeDir, { withFileTypes: true });
    for (const e of entries.filter((x) => x.isFile() && x.name.endsWith(".md"))) {
      const p = join(activeDir, e.name);
      const ref = await parseTaskFile(p, root);
      if (ref) tasks.push(ref);
    }
    tasks.sort((a, b) => (a.id < b.id ? -1 : 1));
  } catch {
    // no active tasks yet
  }
  let mappedTask: AckitTaskRef | null = null;
  if (preferredTaskId) {
    mappedTask = tasks.find((t) => t.id === preferredTaskId) ?? null;
    if (!mappedTask) errors.push(`mapped ACKit task ${preferredTaskId} not found`);
  }
  let policyPath: string | null = null;
  for (const cand of ["ackit-policy.yml", ".ackit/policy.yml", "policy.yml"]) {
    try {
      await readFile(join(root, cand));
      policyPath = join(root, cand);
      break;
    } catch {
      // continue
    }
  }
  return { initialized, configPath, tasks, mappedTask, policyPath, errors };
}

async function parseTaskFile(abs: string, root: string): Promise<AckitTaskRef | null> {
  try {
    const raw = await readFile(abs, "utf8");
    const first = raw.split("\n").slice(0, 30).join("\n");
    const idMatch = first.match(/TASK-[0-9A-Za-z-]+/);
    const titleMatch = raw.match(/^#\s+(.+)$/m);
    const statusMatch = first.match(/status\s*:\s*([a-z-]+)/i);
    const id = idMatch?.[0] ?? null;
    if (!id) return null;
    return {
      id,
      path: abs,
      relPath: abs.substring(root.length + 1).replace(/\\/g, "/"),
      title: (titleMatch?.[1] ?? id).trim().slice(0, 200),
      status: (statusMatch?.[1] ?? "unknown").toLowerCase(),
    };
  } catch {
    return null;
  }
}
