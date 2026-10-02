import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const CLI = fileURLToPath(new URL("../dist/cli/index.js", import.meta.url));
const run = (args) => execFileSync("node", [CLI, ...args], { encoding: "utf8", timeout: 60_000 });

const checks = [["version"], ["--help"], ["doctor", "--help"], ["status", "--help"]];
for (const args of checks) {
  const out = run(args);
  if (!out || out.length < 5) throw new Error(`smoke failed: ${args.join(" ")}`);
  console.log(`ok: ackit-speckit ${args.join(" ")}`);
}
// doctor must exit 0 or env-error, never crash (exit 5)
try {
  run(["doctor"]);
  console.log("ok: doctor");
} catch (e) {
  const code = e.status ?? 1;
  if (code === 5) throw new Error("doctor crashed (exit 5)");
  console.log(`ok: doctor exit ${code} (no crash)`);
}
console.log("cli-smoke PASS");
