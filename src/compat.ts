import { normalizeVersion, satisfiesMinimum } from "./util/versions.js";

export const BRIDGE_VERSION = "0.1.1";
export const COMPAT = {
  node: ">=22",
  ackit: { min: "0.5.0", tested: ["0.5.4"] as string[] },
  speckit: { min: "1.0.0", tested: ["1.0.13"] as string[] },
  os: ["windows", "linux"] as string[],
};

export interface CompatCheck {
  id: string;
  ok: boolean;
  detail: string;
}

export function checkCompat(versions: {
  node: string;
  ackit: string | null;
  speckit: string | null;
}): CompatCheck[] {
  const out: CompatCheck[] = [];
  const nodeNum = versions.node.replace(/^v/, "");
  out.push({
    id: "node-version",
    ok: satisfiesMinimum(nodeNum, "22.0.0"),
    detail: `node ${versions.node} ${satisfiesMinimum(nodeNum, "22.0.0") ? "meets" : "violates"} >=22`,
  });
  out.push({
    id: "ackit-version",
    ok:
      versions.ackit !== null &&
      satisfiesMinimum(normalizeVersion(versions.ackit), COMPAT.ackit.min),
    detail: `ackit ${versions.ackit ?? "missing"} (min ${COMPAT.ackit.min}, tested ${COMPAT.ackit.tested.join(", ")})`,
  });
  out.push({
    id: "speckit-version",
    ok:
      versions.speckit !== null &&
      satisfiesMinimum(normalizeVersion(versions.speckit), COMPAT.speckit.min),
    detail: `specify ${versions.speckit ?? "missing"} (min ${COMPAT.speckit.min}, tested ${COMPAT.speckit.tested.join(", ")})`,
  });
  return out;
}
