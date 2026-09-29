// Validação de idade da pré-consulta.
// Migrado de client/src/lib/preConsultaCore.test.ts, que importava `vitest`
// (dependência inexistente no projeto) e por isso nunca era executado.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sanitizeAgeInput, validateAge } from "../../client/src/lib/preConsultaCore";

describe("preConsulta age validation", () => {
  it("accepts pediatric ages from 0y1m to 18y11m", () => {
    assert.equal(validateAge({ years: "0", months: "1" }).isValid, true);
    assert.equal(validateAge({ years: "18", months: "11" }).isValid, true);
  });

  it("rejects invalid or clinically unusable ages", () => {
    assert.equal(validateAge({ years: "19", months: "0" }).isValid, false);
    assert.equal(validateAge({ years: "4", months: "12" }).isValid, false);
    assert.equal(validateAge({ years: "0", months: "0" }).isValid, false);
    assert.equal(validateAge({ years: "4.5", months: "0" }).isValid, false);
  });

  it("sanitizes pasted age fields to digits only", () => {
    assert.equal(sanitizeAgeInput(" 1a2m "), "12");
    assert.equal(sanitizeAgeInput("-4"), "4");
  });
});
