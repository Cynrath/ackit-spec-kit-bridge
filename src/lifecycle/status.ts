export type LifecycleState =
  | "UNINITIALIZED"
  | "READY"
  | "SPECIFIED"
  | "PLANNED"
  | "TASKED"
  | "IMPLEMENTING"
  | "VERIFYING"
  | "VERIFIED"
  | "STALE"
  | "BLOCKED"
  | "COMPLETE";

export interface LifecycleInputs {
  ackitInitialized: boolean;
  speckitInitialized: boolean;
  blockedReason: string | null;
  hasActiveFeature: boolean;
  hasSpec: boolean;
  hasPlan: boolean;
  hasTasks: boolean;
  hasMapping: boolean;
  hasDiff: boolean;
  verdictResult: "PASS" | "FAIL" | "BLOCKED" | null;
  verdictFresh: boolean | null;
  taskCompleted: boolean;
}

export interface LifecycleResult {
  state: LifecycleState;
  reasonCodes: string[];
}

/**
 * Deterministic lifecycle derivation. Order matters; BLOCKED wins over
 * everything except UNINITIALIZED, COMPLETE requires fresh PASS + completed task.
 */
export function deriveLifecycle(inputs: LifecycleInputs): LifecycleResult {
  const codes: string[] = [];
  if (!inputs.ackitInitialized || !inputs.speckitInitialized) {
    if (!inputs.ackitInitialized) codes.push("ACKIT_NOT_INITIALIZED");
    if (!inputs.speckitInitialized) codes.push("SPECKIT_NOT_INITIALIZED");
    return { state: "UNINITIALIZED", reasonCodes: codes };
  }
  if (inputs.blockedReason) {
    codes.push(inputs.blockedReason);
    return { state: "BLOCKED", reasonCodes: codes };
  }
  if (!inputs.hasActiveFeature) {
    codes.push("NO_ACTIVE_FEATURE");
    return { state: "READY", reasonCodes: codes };
  }
  codes.push(`FEATURE:${inputs.hasActiveFeature ? "present" : "absent"}`);
  if (inputs.taskCompleted && inputs.verdictResult === "PASS" && inputs.verdictFresh === true) {
    codes.push("TASK_COMPLETED_FRESH_PASS");
    return { state: "COMPLETE", reasonCodes: codes };
  }
  if (inputs.verdictResult !== null && inputs.verdictFresh === false) {
    codes.push("VERDICT_STALE");
    return { state: "STALE", reasonCodes: codes };
  }
  if (inputs.verdictResult === "PASS" && inputs.verdictFresh === true) {
    codes.push("FRESH_PASS");
    return { state: "VERIFIED", reasonCodes: codes };
  }
  if (inputs.verdictResult === "FAIL") {
    codes.push("VERDICT_FAIL");
    return { state: "IMPLEMENTING", reasonCodes: codes };
  }
  if (!inputs.hasSpec) {
    codes.push("SPEC_MISSING");
    return { state: "READY", reasonCodes: codes };
  }
  if (!inputs.hasPlan) {
    codes.push("PLAN_MISSING");
    return { state: "SPECIFIED", reasonCodes: codes };
  }
  if (!inputs.hasTasks || !inputs.hasMapping) {
    if (!inputs.hasTasks) codes.push("TASKS_MISSING");
    if (!inputs.hasMapping) codes.push("MAPPING_MISSING");
    return { state: "PLANNED", reasonCodes: codes };
  }
  if (inputs.hasDiff) {
    codes.push("WORK_IN_PROGRESS");
    return { state: "IMPLEMENTING", reasonCodes: codes };
  }
  codes.push("TASKED_NO_DIFF");
  return { state: "TASKED", reasonCodes: codes };
}
