import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const read = (relativePath) =>
  fs.readFileSync(new URL(relativePath, root), "utf8");

test("navegar para uma escala guarda o estado completo do filtro", () => {
  const source = read("client/src/pages/filtro-engine.tsx");
  assert.match(source, /FILTER_NAVIGATION_STORAGE_KEY/);
  assert.match(source, /selectedRespondente/);
  assert.match(source, /selectedCommunication/);
  assert.match(source, /selectedLiteracy/);
  assert.match(source, /selectedAssessmentType/);
  assert.match(source, /selectedSignalIds/);
  assert.match(source, /compareIds/);
  assert.match(source, /onClick=\{preserveFilterNavigationState\}/);
});

test("o PDF recebe o instante de conclusão e não reinterpreta a opção marcada", () => {
  const report = read("client/src/components/ClinicalReport.tsx");
  const generic = read("client/src/components/GenericScale.tsx");
  const interactive = read("client/src/components/InteractiveScaleRunner.tsx");
  const save = read("client/src/components/SaveToPatient.tsx");
  const reportHelper = read("client/src/lib/scaleResponseReport.ts");
  assert.match(report, /applicationDate\?: string \| Date/);
  assert.match(
    report,
    /Data da aplicação: \$\{formatClinicalDateTime\(applicationDate\)/,
  );
  assert.match(generic, /setApplicationDate\(new Date\(\)\.toISOString\(\)\)/);
  assert.match(generic, /applicationDate=\{applicationDate \?\? undefined\}/);
  assert.match(
    generic,
    /config\.labels\[answers\[item\.key\] \?\? -1\] \?\? "Não respondida"/,
  );
  assert.match(
    interactive,
    /setApplicationDate\(new Date\(\)\.toISOString\(\)\)/,
  );
  assert.match(
    interactive,
    /applicationDate=\{applicationDate \?\? undefined\}/,
  );
  assert.match(interactive, /item\.options\[answers\[index\]\]\.label/);
  assert.match(save, /applicationDate/);
  assert.match(reportHelper, /formatClinicalLongDate/);
  assert.match(reportHelper, /timeLabel/);
  assert.match(
    save,
    /Data da aplicação: \$\{formatClinicalDateTime\(applicationDate\)/,
  );
});

test("o backend persiste a data recebida e o histórico devolve a origem remota", () => {
  const express = read("server/routes.ts");
  const storage = read("server/storage.ts");
  const d1Results = read("functions/api/patients/[id]/results.ts");
  assert.match(express, /parseApplicationDate/);
  assert.match(express, /storage\.saveResult\(parsed, applicationDate\)/);
  assert.match(
    storage,
    /saveResult\(insert: InsertScaleResult, createdAt\?: string\)/,
  );
  assert.match(
    d1Results,
    /origin: isFamilyLinkResult\(row\.details\) \? "family-link"/,
  );
});
