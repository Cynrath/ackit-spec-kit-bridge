export function compareVersions(a: string, b: string): number {
  const pa = a
    .replace(/^v/, "")
    .split(".")
    .map((x) => Number.parseInt(x, 10) || 0);
  const pb = b
    .replace(/^v/, "")
    .split(".")
    .map((x) => Number.parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

export function satisfiesMinimum(version: string, minimum: string): boolean {
  return compareVersions(version, minimum) >= 0;
}

export function normalizeVersion(raw: string): string {
  const m = raw.match(/(\d+\.\d+\.\d+)/);
  return m?.[1] ?? raw.trim();
}
