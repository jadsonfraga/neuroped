import assert from "node:assert/strict";
import { buildAppHashUrl } from "../../client/src/lib/appUrl";
import {
  resolveLoginDestination,
  safeLoginDestination,
  stripLoginNextParameter,
} from "../../client/src/lib/loginRedirect";

assert.equal(
  buildAppHashUrl(
    "/verificar",
    { h: "abc 123" },
    "https://jadsonfraga.github.io/neuroped/index.html#/receita-c1",
  ),
  "https://jadsonfraga.github.io/neuroped/#/verificar?h=abc+123",
);
assert.equal(
  buildAppHashUrl("verificar", {}, "https://neuroped.pages.dev/#/"),
  "https://neuroped.pages.dev/#/verificar",
);

assert.equal(
  resolveLoginDestination("https://neuroped.pages.dev/?next=%2Fagenda#/login"),
  "/agenda",
);
assert.equal(
  resolveLoginDestination(
    "https://jadsonfraga.github.io/neuroped/#/login?next=%2Fpacientes%3Faba%3Dhistorico",
  ),
  "/pacientes?aba=historico",
);
assert.equal(safeLoginDestination("https://evil.example/roubo"), "/");
assert.equal(safeLoginDestination("//evil.example/roubo"), "/");
assert.equal(safeLoginDestination("/login"), "/");
assert.equal(safeLoginDestination("/receita-c1?paciente=123"), "/receita-c1?paciente=123");
assert.equal(
  stripLoginNextParameter(
    "https://neuroped.pages.dev/?source=portal&next=%2Fagenda#/login",
  ),
  "https://neuroped.pages.dev/?source=portal#/login",
);
assert.equal(
  stripLoginNextParameter(
    "https://neuroped.pages.dev/#/login?source=portal&next=%2Fagenda",
  ),
  "https://neuroped.pages.dev/#/login?source=portal",
);

console.log("✓ URLs de QR e retorno pós-login preservam rotas internas seguras");
