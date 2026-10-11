// A assinatura dos documentos OBS-10, Regula-20 e da Central de Documentos
// vem do emissor configurado; sem perfil salvo, continua a histórica.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { LEGACY_AUTHOR_SIGNATURE, issuerSignatureLine } from "../../client/src/lib/issuerSignature";
import { makeDossier } from "../../client/src/features/obs10/dossier";
import { makeReport } from "../../client/src/features/obs10/session";

describe("issuerSignatureLine", () => {
  it("sem perfil configurado mantém a assinatura histórica", () => {
    assert.equal(LEGACY_AUTHOR_SIGNATURE, "Dr. Jadson Fraga · Neuropediatra · CRM-PE 25227 · RQE 17756");
    assert.equal(issuerSignatureLine(null), LEGACY_AUTHOR_SIGNATURE);
    assert.equal(issuerSignatureLine({ doctorName: "Dra. Ana", specialty: "", credentialsLine: "CRM-SP 1", profileConfigured: false }), LEGACY_AUTHOR_SIGNATURE);
  });
  it("com perfil configurado usa nome, especialidade e registro do emissor", () => {
    assert.equal(
      issuerSignatureLine({ doctorName: "Dra. Ana Souza", specialty: "Neuropediatra", credentialsLine: "CRM-SP 123456 · RQE 9", profileConfigured: true }),
      "Dra. Ana Souza · Neuropediatra · CRM-SP 123456 · RQE 9",
    );
    assert.equal(issuerSignatureLine({ doctorName: " ", specialty: "", credentialsLine: "", profileConfigured: true }), LEGACY_AUTHOR_SIGNATURE);
  });
  it("geradores OBS-10 não carregam mais a identidade fixa", () => {
    for (const path of ["client/src/features/obs10/dossier.ts", "client/src/features/obs10/session.ts", "client/src/pages/pre-consulta-obs10.tsx", "client/src/components/Regula20Questionnaire.tsx"]) {
      assert.doesNotMatch(readFileSync(path, "utf8"), /CRM-PE 25227/, path);
    }
    assert.equal(typeof makeDossier, "function");
    assert.equal(makeReport.length >= 1, true);
  });
});
