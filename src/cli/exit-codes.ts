export const EXIT_SUCCESS = 0;
export const EXIT_GATE_FAIL = 1;
export const EXIT_USAGE = 2;
export const EXIT_ENV = 3;
export const EXIT_SECURITY = 4;
export const EXIT_INTERNAL = 5;

export const EXIT_CODE_NAMES: Record<number, string> = {
  [EXIT_SUCCESS]: "SUCCESS",
  [EXIT_GATE_FAIL]: "GATE_OR_VERIFICATION_FAILED",
  [EXIT_USAGE]: "USAGE_OR_CONFIG_ERROR",
  [EXIT_ENV]: "ENVIRONMENT_OR_DEPENDENCY_ERROR",
  [EXIT_SECURITY]: "SECURITY_BOUNDARY_VIOLATION",
  [EXIT_INTERNAL]: "INTERNAL_ERROR",
};

export function exitCodeName(code: number): string {
  return EXIT_CODE_NAMES[code] ?? "UNKNOWN";
}
