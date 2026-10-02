import { execFile } from "node:child_process";

export interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  /** True when the command itself could not be started (missing binary). */
  notFound: boolean;
}

const MAX_OUTPUT = 512_000;

function truncate(s: string): string {
  if (s.length > MAX_OUTPUT) return s.slice(0, MAX_OUTPUT);
  return s;
}

function runOnce(
  command: string,
  args: readonly string[],
  options: { cwd?: string; timeoutMs?: number },
): Promise<ExecResult & { spawnError?: NodeJS.ErrnoException }> {
  const timeout = options.timeoutMs ?? 120_000;
  return new Promise((resolve) => {
    const child = execFile(
      command,
      [...args],
      { cwd: options.cwd, shell: false, timeout, maxBuffer: MAX_OUTPUT * 2, windowsHide: true },
      (error, stdout, stderr) => {
        const out = truncate(typeof stdout === "string" ? stdout : String(stdout ?? ""));
        const err = truncate(typeof stderr === "string" ? stderr : String(stderr ?? ""));
        if (error && "killed" in error && (error as { killed: boolean }).killed) {
          resolve({ exitCode: 124, stdout: out, stderr: err, timedOut: false, notFound: false });
          return;
        }
        const errno = error as NodeJS.ErrnoException | null;
        if (errno && (errno.code === "ENOENT" || errno.code === "EACCES")) {
          resolve({
            exitCode: 127,
            stdout: out,
            stderr: err,
            timedOut: false,
            notFound: true,
            spawnError: errno,
          });
          return;
        }
        const code =
          error && typeof (error as { code?: unknown }).code === "number"
            ? ((error as { code: number }).code as number)
            : 0;
        resolve({ exitCode: code, stdout: out, stderr: err, timedOut: false, notFound: false });
      },
    );
    void child;
  });
}

/**
 * Quote one argv element for `cmd.exe /c`. Inside double quotes cmd treats
 * metacharacters (`&`, `|`, `<`, `>`, `^`, `;`) as literals; `%` still expands
 * so it is doubled, and `"` is backslash-escaped. Trailing backslashes are
 * doubled so they cannot escape the closing quote.
 */
export function quoteCmdArg(arg: string): string {
  if (/^[A-Za-z0-9_@%+=:,./\\-]+$/.test(arg) && !arg.includes("%")) return arg;
  let escaped = arg.replace(/%/g, "%%").replace(/(\\*)"/g, '$1$1\\"');
  escaped = escaped.replace(/(\\+)$/, "$1$1");
  return `"${escaped}"`;
}

/**
 * Safe subprocess execution: argv array, shell:false, timeout, bounded output.
 * On Windows, npm-global shims (`ackit.cmd`, `.ps1`-companioned `.cmd`) cannot
 * be spawned directly via CreateProcess; when direct spawn reports ENOENT we
 * retry once through `cmd.exe /d /s /c` with each argv element quoted by
 * {@link quoteCmdArg}. No shell string is ever composed from uncontrolled
 * input beyond this quoting, and behavior is identical on POSIX (no fallback).
 */
export async function execFileSafe(
  command: string,
  args: readonly string[],
  options: { cwd?: string; timeoutMs?: number } = {},
): Promise<ExecResult> {
  const direct = await runOnce(command, args, options);
  if (!direct.notFound || process.platform !== "win32") {
    const { spawnError: _ignored, ...rest } = direct;
    return rest;
  }
  // Windows shim fallback: cmd.exe /d /s /c <command> <quoted args...>.
  const cmdLine = [command, ...args.map(quoteCmdArg)];
  const fallback = await runOnce("cmd.exe", ["/d", "/s", "/c", ...cmdLine], options);
  if (fallback.notFound) {
    return {
      exitCode: 127,
      stdout: "",
      stderr: `command not found: ${command}`,
      timedOut: false,
      notFound: true,
    };
  }
  // cmd.exe reports an unresolvable command with exit code 1 and a
  // "not recognized" message; surface it as notFound so callers can
  // distinguish tool-not-installed from check-failed.
  const combined = `${fallback.stdout}\n${fallback.stderr}`;
  if (/is not recognized as an internal or external command/i.test(combined)) {
    return {
      exitCode: 127,
      stdout: "",
      stderr: `command not found: ${command}`,
      timedOut: false,
      notFound: true,
    };
  }
  const { spawnError: _ignored2, ...rest } = fallback;
  return rest;
}
