import { z } from "zod";

export const BridgeConfigSchema = z.object({
  schemaVersion: z.literal(1),
  ackit: z
    .object({
      command: z.string().min(1).default("ackit"),
      minVersion: z.string().default("0.5.0"),
    })
    .default({ command: "ackit", minVersion: "0.5.0" }),
  specKit: z
    .object({
      command: z.string().min(1).default("specify"),
      minVersion: z.string().default("1.0.0"),
    })
    .default({ command: "specify", minVersion: "1.0.0" }),
  mapping: z
    .object({
      mode: z.literal("active-feature").default("active-feature"),
    })
    .default({ mode: "active-feature" }),
  verification: z
    .object({
      defaultProfile: z.enum(["quick", "standard", "high-risk"]).default("standard"),
      stalePolicy: z.literal("fail").default("fail"),
    })
    .default({ defaultProfile: "standard", stalePolicy: "fail" }),
  profiles: z
    .object({
      quick: z.record(z.string(), z.unknown()).default({}),
      standard: z.record(z.string(), z.unknown()).default({}),
      "high-risk": z.record(z.string(), z.unknown()).default({}),
    })
    .default({ quick: {}, standard: {}, "high-risk": {} }),
  evidence: z
    .object({
      redact: z.boolean().default(true),
    })
    .default({ redact: true }),
});

export type BridgeConfig = z.infer<typeof BridgeConfigSchema>;
export type VerificationProfile = "quick" | "standard" | "high-risk";

export const DEFAULT_CONFIG_YAML = `# ACKit Spec Kit Bridge configuration.
schemaVersion: 1

ackit:
  command: ackit
  minVersion: 0.5.0

specKit:
  command: specify
  minVersion: 1.0.0

mapping:
  mode: active-feature

verification:
  defaultProfile: standard
  stalePolicy: fail

profiles:
  quick: {}
  standard: {}
  high-risk: {}

evidence:
  redact: true
`;
