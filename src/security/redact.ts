const SECRET_PATTERNS: RegExp[] = [
  /gh[op]_[A-Za-z0-9_]{10,}/g,
  /github_pat_[A-Za-z0-9_]{10,}/g,
  /xox[baprs]-[A-Za-z0-9-]{10,}/g,
  /AKIA[0-9A-Z]{16}/g,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]{0,200}?-----END [A-Z ]*PRIVATE KEY-----/g,
  /(api[_-]?key|secret|token|password)\s*[:=]\s*['"][^'"]{4,}['"]/gi,
  /(api[_-]?key|secret|token|password)\s*[:=]\s*\S{8,}/gi,
  /npm_[A-Za-z0-9]{10,}/g,
];

export interface RedactionResult {
  text: string;
  redacted: boolean;
  count: number;
}

export function redactSecrets(input: string): RedactionResult {
  let text = input;
  let count = 0;
  for (const re of SECRET_PATTERNS) {
    re.lastIndex = 0;
    text = text.replace(re, (m) => {
      count += 1;
      // Keep a short non-sensitive hint of shape, never the value.
      void m;
      return "[REDACTED]";
    });
  }
  return { text, redacted: count > 0, count };
}

export function redactObject<T>(value: T): { value: T; redactedCount: number } {
  const seen = new WeakSet();
  let count = 0;
  const walk = (v: unknown): unknown => {
    if (typeof v === "string") {
      const r = redactSecrets(v);
      count += r.count;
      return r.text;
    }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      if (seen.has(v as object)) return "[Circular]";
      seen.add(v as object);
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        if (/^(token|secret|password|api[_-]?key|authorization)$/i.test(k)) {
          count += 1;
          out[k] = "[REDACTED]";
        } else {
          out[k] = walk(val);
        }
      }
      return out;
    }
    return v;
  };
  return { value: walk(value) as T, redactedCount: count };
}
