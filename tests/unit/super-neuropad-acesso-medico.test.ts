import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { podeVerModoMedico, type SessaoParaModoMedico } from "../../client/src/features/super-neuropad/acessoMedico";

const LOGADO_OWNER: SessaoParaModoMedico = { accessMode: "remote", isAuthenticated: true, clinicRole: "owner", clinicStatus: "active" };

test("somente o owner autenticado, em clínica ativa, abre o modo médico", () => {
  assert.equal(podeVerModoMedico(LOGADO_OWNER), true);
});

test("quem não entrou não vê o modo médico: modo local, sessão ausente, verificação em andamento", () => {
  assert.equal(podeVerModoMedico({ ...LOGADO_OWNER, accessMode: "local", isAuthenticated: false }), false, "modo local");
  assert.equal(podeVerModoMedico({ ...LOGADO_OWNER, accessMode: "remote", isAuthenticated: false }), false, "sem login");
  assert.equal(podeVerModoMedico({ ...LOGADO_OWNER, accessMode: "checking" }), false, "verificando sessão");
  assert.equal(podeVerModoMedico({ ...LOGADO_OWNER, isAuthenticated: false, accessMode: "remote", clinicRole: null }), false, "sem clínica");
});

test("outros papéis de clínica não veem o modo médico, mesmo logados", () => {
  for (const clinicRole of ["clinic_admin", "professional", "assistant", "financial"]) {
    assert.equal(podeVerModoMedico({ ...LOGADO_OWNER, clinicRole }), false, clinicRole);
  }
});

test("owner sem clínica ativa, com senha pendente ou sem papel não abre o modo médico", () => {
  assert.equal(podeVerModoMedico({ ...LOGADO_OWNER, clinicStatus: "suspended" }), false, "clínica suspensa");
  assert.equal(podeVerModoMedico({ ...LOGADO_OWNER, clinicStatus: "closed" }), false, "clínica encerrada");
  assert.equal(podeVerModoMedico({ ...LOGADO_OWNER, mustChangePassword: true }), false, "troca de senha pendente");
  assert.equal(podeVerModoMedico({ ...LOGADO_OWNER, clinicRole: undefined }), false, "sem papel");
});

test("componente: aba médica, cobertura e exportação clínica dependem da sessão; a sessão remonta o circuito", () => {
  const component = readFileSync("client/src/features/super-neuropad/ClinicalCircuit.tsx", "utf8");
  assert.match(component, /podeVerModoMedico\(\{/, "a decisão vem da regra pura");
  assert.match(component, /key=\{modoMedico \? "modo-medico" : "pre-consulta"\}/, "trocar de sessão remonta o circuito");
  assert.match(component, /\.\.\.\(modoMedico \? \[\{ key: "cobertura"/, "aba de cobertura só para o owner");
  assert.match(component, /\.\.\.\(modoMedico && doMedico\.length/, "aba do médico só para o owner");
  assert.match(component, /modoMedico && \(tab === "medico" \|\| tab === "cobertura"\)/, "exportação clínica só para o owner");
  assert.match(component, /const doMedico = modoMedico \?/, "nenhuma tarefa médica é listada sem o modo");
});
