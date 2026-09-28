// Regressão: a lista de pacientes usa a URL completa (com busca/paginação)
// como chave. Invalidar ["/api/patients"] não a atingia e, com
// staleTime: Infinity, importar backup/criar/editar paciente deixava a lista
// e o seletor "Salvar em paciente" desatualizados até recarregar a página.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { apiQueryKeyMatches } from "../../client/src/lib/apiQueryKey";

describe("apiQueryKeyMatches", () => {
  it("casa endpoint exato, com query string e sub-recursos", () => {
    assert.equal(apiQueryKeyMatches(["/api/patients"], "/api/patients"), true);
    assert.equal(apiQueryKeyMatches(["/api/patients?q=ana&page=2&limit=50"], "/api/patients"), true);
    assert.equal(apiQueryKeyMatches(["/api/patients/p1"], "/api/patients"), true);
    assert.equal(apiQueryKeyMatches(["/api/live/patients?clinicId=c1"], "/api/live/patients"), true);
    assert.equal(apiQueryKeyMatches(["/api/live/patients/p1?clinicId=c1"], "/api/live/patients"), true);
  });

  it("não casa prefixo textual solto, outro endpoint ou chave não textual", () => {
    assert.equal(apiQueryKeyMatches(["/api/patients-archive"], "/api/patients"), false);
    assert.equal(apiQueryKeyMatches(["/api/live/patients?clinicId=c1"], "/api/patients"), false);
    assert.equal(apiQueryKeyMatches(["/api/patient"], "/api/patients"), false);
    assert.equal(apiQueryKeyMatches([42], "/api/patients"), false);
    assert.equal(apiQueryKeyMatches([], "/api/patients"), false);
  });

  it("telas de paciente invalidam por endpoint, não pela chave literal da página", () => {
    const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
    const pacientes = read("client/src/pages/pacientes.tsx");
    assert.doesNotMatch(pacientes, /invalidateQueries\(\{\s*queryKey:\s*\["\/api\/patients"\]/);
    assert.doesNotMatch(pacientes, /invalidateQueries\(\{\s*queryKey:\s*\[patientQueryKey\]/);
    for (const path of ["client/src/pages/pacientes.tsx", "client/src/pages/paciente-detalhe.tsx", "client/src/components/SaveToPatient.tsx"]) {
      assert.match(read(path), /invalidateApiQueries\(isRemoteClinical \? "\/api\/live\/patients" : "\/api\/patients"\)/, path);
    }
  });
});
