import { execFileSafe } from "../security/exec.js";

export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

const MAX_BUFFER = 1_000_000;

async function run(
  command: string,
  args: readonly string[],
  cwd: string,
  timeoutMs = 120_000,
): Promise<CommandResult> {
  const r = await execFileSafe(command, args, { cwd, timeoutMs });
  return {
    exitCode: r.notFound ? 127 : r.exitCode,
    stdout: r.notFound
      ? `command not found: ${command}\n${r.stderr}`
      : r.stdout.slice(0, MAX_BUFFER),
    stderr: r.stderr.slice(0, MAX_BUFFER),
  };
}

export interface AckitAdapterOptions {
  command: string;
  cwd: string;
}

export async function ackitVersion(opts: AckitAdapterOptions): Promise<string | null> {
  const r = await run(opts.command, ["--version"], opts.cwd, 30_000);
  if (r.exitCode !== 0) return null;
  const m = `${r.stdout}\n${r.stderr}`.match(/(\d+\.\d+\.\d+)/);
  return m?.[1] ?? null;
}

export async function ackitJson(
  opts: AckitAdapterOptions,
  args: readonly string[],
  timeoutMs = 120_000,
): Promise<{ exitCode: number; json: unknown; stdout: string; stderr: string }> {
  const r = await run(opts.command, [...args, "--json"], opts.cwd, timeoutMs);
  let json: unknown = null;
  try {
    json = JSON.parse(r.stdout);
  } catch {
    json = null;
  }
  return { exitCode: r.exitCode, json, stdout: r.stdout, stderr: r.stderr };
}

export async function ackitRun(
  opts: AckitAdapterOptions,
  args: readonly string[],
  timeoutMs = 180_000,
): Promise<CommandResult> {
  return run(opts.command, args, opts.cwd, timeoutMs);
}
