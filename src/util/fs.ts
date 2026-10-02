import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export async function readTextFile(path: string, maxBytes = 2_000_000): Promise<string | null> {
  try {
    const buf = await readFile(path);
    if (buf.length > maxBytes) return buf.subarray(0, maxBytes).toString("utf8");
    return buf.toString("utf8");
  } catch {
    return null;
  }
}

export async function atomicWriteFile(path: string, content: string | Uint8Array): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  await writeFile(tmp, content, "utf8");
  await rename(tmp, path);
}

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}
