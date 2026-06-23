import { describe, expect, it } from "vitest";
import { sanitizeAgeInput, validateAge } from "@/lib/preConsultaCore";

describe("preConsulta age validation", () => {
  it("accepts pediatric ages from 0y1m to 18y11m", () => {
    expect(validateAge({ years: "0", months: "1" }).isValid).toBe(true);
    expect(validateAge({ years: "18", months: "11" }).isValid).toBe(true);
  });

  it("rejects invalid or clinically unusable ages", () => {
    expect(validateAge({ years: "19", months: "0" }).isValid).toBe(false);
    expect(validateAge({ years: "4", months: "12" }).isValid).toBe(false);
    expect(validateAge({ years: "0", months: "0" }).isValid).toBe(false);
    expect(validateAge({ years: "4.5", months: "0" }).isValid).toBe(false);
  });

  it("sanitizes pasted age fields to digits only", () => {
    expect(sanitizeAgeInput(" 1a2m ")).toBe("12");
    expect(sanitizeAgeInput("-4")).toBe("4");
  });
});
