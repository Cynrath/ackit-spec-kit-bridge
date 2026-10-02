export interface JsonEnvelope<T = unknown> {
  schema: string;
  version: number;
  data: T;
}

export function envelope<T>(schema: string, version: number, data: T): JsonEnvelope<T> {
  return { schema, version, data };
}

export function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function printHuman(lines: string[]): void {
  for (const line of lines) process.stdout.write(`${line}\n`);
}
