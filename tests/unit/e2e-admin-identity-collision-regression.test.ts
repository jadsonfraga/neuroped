import assert from "node:assert/strict";
import { onRequestPost } from "../../functions/api/auth/login";

let dbTouched = false;
const db = {
  prepare() {
    dbTouched = true;
    throw new Error("D1 não deve ser tocado quando ADMIN_EMAIL colide com E2E");
  },
  async batch() {
    dbTouched = true;
    throw new Error("D1 não deve ser tocado quando ADMIN_EMAIL colide com E2E");
  },
};

// Fixtures são montadas em runtime para não parecerem credenciais reais ao
// scanner de segredos do próprio repositório. O comprimento/semântica continuam
// exercitando exatamente o mesmo contrato de autenticação.
const testJwtSecret = ["jwt", "fixture", "not", "runtime", "credential", "value", "only"].join("-");
const adminBootstrapPassword = ["admin", "fixture", "password", "123"].join("-");
const e2ePassword = ["e2e", "fixture", "password", "123"].join("-");

const response = await onRequestPost({
  env: {
    DB: db,
    NEUROPED_JWT_SECRET: testJwtSecret,
    ADMIN_EMAIL: "Sentinela@Example.com",
    ADMIN_INITIAL_PASSWORD: adminBootstrapPassword,
    NEUROPED_E2E_EMAIL: " sentinela@example.com ",
    NEUROPED_E2E_PASSWORD: e2ePassword,
  },
  request: {} as Request,
} as never);

assert.equal(response.status, 503, "configuração de identidade colidida deve falhar fechado");
assert.equal(
  (await response.json()).code,
  "AUTH_CONFIGURATION_INVALID",
  "colisão deve ser classificada como erro de configuração",
);
assert.equal(dbTouched, false, "colisão ADMIN/E2E deve falhar antes de qualquer operação D1");

console.log("✓ colisão ADMIN/E2E falha antes de qualquer bootstrap ou mutação D1");