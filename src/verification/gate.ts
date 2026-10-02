export interface GateInput {
  verdictResult: "PASS" | "FAIL" | "BLOCKED" | null;
  verdictFresh: boolean | null;
  hasSpec: boolean;
  hasPlan: boolean;
  hasTasks: boolean;
  hasMapping: boolean;
  blockingSecurity: boolean;
  profileChecksComplete: boolean;
}

export interface GateResult {
  pass: boolean;
  reasonCodes: string[];
}

const PROFILE_RANK: Record<string, number> = { quick: 0, standard: 1, "high-risk": 2 };

/** A verdict satisfies the expected profile when its rank meets or exceeds it. */
export function profileSatisfies(actual: string | null, expected: string): boolean {
  if (!actual) return false;
  return (PROFILE_RANK[actual] ?? -1) >= (PROFILE_RANK[expected] ?? 99);
}

export function evaluateGate(input: GateInput): GateResult {
  const codes: string[] = [];
  if (!input.verdictResult) {
    return { pass: false, reasonCodes: ["NOT_VERIFIED"] };
  }
  if (input.verdictResult !== "PASS") {
    codes.push(`VERDICT_${input.verdictResult}`);
    return { pass: false, reasonCodes: codes };
  }
  if (input.verdictFresh !== true) {
    codes.push("VERDICT_STALE");
    return { pass: false, reasonCodes: codes };
  }
  if (!input.hasSpec) codes.push("SPEC_MISSING");
  if (!input.hasPlan) codes.push("PLAN_MISSING");
  if (!input.hasTasks) codes.push("TASKS_MISSING");
  if (!input.hasMapping) codes.push("MAPPING_MISSING");
  if (input.blockingSecurity) codes.push("SECURITY_BLOCKING");
  if (!input.profileChecksComplete) codes.push("CHECKS_INCOMPLETE");
  if (codes.length > 0) return { pass: false, reasonCodes: codes };
  return { pass: true, reasonCodes: ["GATE_PASS"] };
}
