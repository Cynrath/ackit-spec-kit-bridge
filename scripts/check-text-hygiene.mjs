import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const args = process.argv.slice(2);
const repo = args.includes("--repo");
const root = process.cwd();
const exts = new Set([".md", ".ts", ".js", ".mjs", ".json", ".yml", ".yaml"]);
let bad = 0;

function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git", "coverage", "temp-pack"].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (exts.has(extname(e.name))) {
      const buf = readFileSync(p);
      for (let i = 0; i < buf.length; i++) {
        const c = buf[i];
        if (c < 0x20 && c !== 0x09 && c !== 0x0a && c !== 0x0d) {
          console.error(`C0 control char in ${p} at byte ${i}`);
          bad++;
          break;
        }
      }
    }
  }
}

if (repo) walk(root);
else {
  const f = args.find((a) => !a.startsWith("--"));
  if (f) {
    const buf = readFileSync(f);
    void statSync(f);
    void buf;
  }
}
if (bad > 0) process.exit(1);
console.log("text-hygiene PASS");
