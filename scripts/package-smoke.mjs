import { execFileSync, execSync } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Pack the npm tarball, install it into an isolated dir, smoke the installed CLI.
const out = execSync("pnpm pack --pack-destination temp-pack", {
  encoding: "utf8",
  timeout: 180_000,
});
console.log(out);
const { readdirSync } = await import("node:fs");
const files = readdirSync("temp-pack").filter((f) => f.endsWith(".tgz"));
if (files.length === 0) throw new Error("no tarball produced");
const tarball = join(process.cwd(), "temp-pack", files[0]);
console.log(`tarball: ${tarball}`);
const dir = mkdtempSync(join(tmpdir(), "bridge-pkg-smoke-"));
// npm is a .cmd shim on Windows; spawn it through cmd.exe there.
const npmCmd = process.platform === "win32" ? ["cmd.exe", "/d", "/s", "/c", "npm"] : ["npm"];
execFileSync(
  npmCmd[0],
  [...npmCmd.slice(1), "install", "-g", tarball, "--prefix", join(dir, "prefix")],
  {
    timeout: 180_000,
  },
);
const bin = join(dir, "prefix", "ackit-speckit");
const binWin = `${bin}.cmd`;
const cli = existsSync(binWin)
  ? binWin
  : join(dir, "prefix", "node_modules", ".bin", "ackit-speckit.cmd");
void cli;
const installed = join(
  dir,
  "prefix",
  "node_modules",
  "@cynrath",
  "ackit-spec-kit-bridge",
  "dist",
  "cli",
  "index.js",
);
if (!existsSync(installed)) throw new Error(`installed CLI missing: ${installed}`);
const v = execFileSync("node", [installed, "version"], { encoding: "utf8", timeout: 60_000 });
console.log(v);
if (!v.includes("0.1.0")) throw new Error("installed version mismatch");
console.log("package-smoke PASS");
