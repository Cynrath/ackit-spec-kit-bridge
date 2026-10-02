import { execFileSync, execSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Pack the npm tarball, install it into an isolated dir, smoke the installed CLI.
const out = execSync("pnpm pack --pack-destination temp-pack", {
  encoding: "utf8",
  timeout: 180_000,
});
console.log(out);
const { readdirSync } = await import("node:fs");
const pkgPre = JSON.parse(readFileSync("package.json", "utf8"));
const files = readdirSync("temp-pack").filter((f) => f.endsWith(".tgz"));
if (files.length === 0) throw new Error("no tarball produced");
// Prefer the tarball matching the current package version (stale tarballs
// from earlier versions may sit in temp-pack during development).
const exact = files.find((f) => f.includes(pkgPre.version));
const tarball = join(process.cwd(), "temp-pack", exact ?? files[0]);
console.log(`tarball: ${tarball}`);
const dir = mkdtempSync(join(tmpdir(), "bridge-pkg-smoke-"));
const prefix = join(dir, "prefix");
// npm is a .cmd shim on Windows; spawn it through cmd.exe there.
const npmBin = process.platform === "win32" ? "cmd.exe" : "npm";
const npmBase = process.platform === "win32" ? ["/d", "/s", "/c", "npm"] : [];
function runNpm(args) {
  return execFileSync(npmBin, [...npmBase, ...args], { encoding: "utf8", timeout: 180_000 });
}
runNpm(["install", "-g", tarball, "--prefix", prefix]);
// Global layout differs per OS (prefix/node_modules vs prefix/lib/node_modules);
// ask npm instead of guessing.
const globalRoot = runNpm(["root", "-g", "--prefix", prefix]).trim().split("\n").pop();
const installed = join(globalRoot, "@cynrath", "ackit-spec-kit-bridge", "dist", "cli", "index.js");
if (!existsSync(installed)) throw new Error(`installed CLI missing: ${installed}`);
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const v = execFileSync("node", [installed, "version"], { encoding: "utf8", timeout: 60_000 });
console.log(v);
if (!v.includes(pkg.version)) throw new Error("installed version mismatch");
console.log("package-smoke PASS");
