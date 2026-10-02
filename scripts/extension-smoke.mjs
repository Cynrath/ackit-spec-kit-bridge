import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

const root = process.cwd();
const manifestPath = join(root, "spec-kit", "extension", "extension.yml");
if (!existsSync(manifestPath)) throw new Error("extension.yml missing");
const manifest = parseYaml(readFileSync(manifestPath, "utf8"));
if (manifest.extension?.id !== "ackit") throw new Error("extension id must be ackit");
const names = (manifest.provides?.commands ?? []).map((c) => c.name);
const expected = [
  "speckit.ackit.sync",
  "speckit.ackit.status",
  "speckit.ackit.verify",
  "speckit.ackit.gate",
  "speckit.ackit.checkpoint",
  "speckit.ackit.handoff",
  "speckit.ackit.complete",
];
for (const e of expected) {
  if (!names.includes(e)) throw new Error(`missing command ${e}`);
  const file = manifest.provides.commands.find((c) => c.name === e).file;
  if (!existsSync(join(root, "spec-kit", "extension", file)))
    throw new Error(`missing file ${file}`);
}
const hooks = manifest.hooks ?? {};
for (const h of [
  "after_specify",
  "after_plan",
  "after_tasks",
  "before_implement",
  "after_implement",
]) {
  if (!hooks[h]) throw new Error(`missing hook ${h}`);
}
if (!existsSync(join(root, "spec-kit", "workflow", "workflow.yml")))
  throw new Error("workflow.yml missing");
console.log(`extension smoke PASS (${names.length} commands, ${Object.keys(hooks).length} hooks)`);
