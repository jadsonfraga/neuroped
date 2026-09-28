// Regressão: formulários clínicos (diário de crises, Ashworth/Tardieu, fichas
// de registro, diários) preenchiam "hoje" com toISOString().slice(0, 10), que
// é a data em UTC — no Brasil, depois das 21h, o registro nascia no dia
// seguinte (e o diário de crises juntava essa data com a hora local).
process.env.TZ = "America/Sao_Paulo";

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { localIsoDate } from "../../client/src/lib/clinicalDate";

describe("localIsoDate", () => {
  it("usa o calendário local, não UTC", () => {
    const lateEvening = new Date("2026-09-28T23:30:00-03:00");
    assert.equal(lateEvening.toISOString().slice(0, 10), "2026-09-29", "premissa: UTC já virou o dia");
    assert.equal(localIsoDate(lateEvening), "2026-09-28");
    assert.equal(localIsoDate(new Date("2026-01-05T00:10:00-03:00")), "2026-01-05");
  });

  it("formulários clínicos não usam a data UTC como padrão de hoje", () => {
    for (const path of [
      "client/src/components/DiarioClinico.tsx",
      "client/src/pages/diario-epilepsia.tsx",
      "client/src/pages/espasticidade.tsx",
      "client/src/pages/fichas-registro.tsx",
    ]) {
      const source = readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
      assert.doesNotMatch(source, /(data|f\[field\.key\])\s*[:=]\s*new Date\(\)\.toISOString\(\)\.slice\(0, 10\)/, path);
      assert.match(source, /localIsoDate\(\)/, path);
    }
  });
});
