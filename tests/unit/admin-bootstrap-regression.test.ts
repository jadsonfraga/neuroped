import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bootstrapAdmin } from "../../functions/api/auth/_shared";

const existingUser = {
  id: "admin-1",
  name: "Administrador",
  email: "admin@example.com",
  role: "admin",
  is_active: 1,
  password_hash:
    "pbkdf2$sha256$100000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  must_change_password: 0,
  failed_login_attempts: 0,
  locked_until: null,
};

let batchCalls = 0;
const bootstrapPassword = ["seed", "reset"].join("-");
const fakeDb = {
  prepare(sql: string) {
    return {
      bind(..._args: unknown[]) {
        return {
          async first() {
            if (sql.includes("FROM users")) return existingUser;
            if (sql.includes("FROM app_settings")) return null;
            return null;
          },
        };
      },
    };
  },
  async batch(_statements: unknown[]) {
    batchCalls += 1;
    return [];
  },
};

await bootstrapAdmin(fakeDb as never, {
  ADMIN_EMAIL: existingUser.email,
  ADMIN_INITIAL_PASSWORD: bootstrapPassword,
});

assert.equal(
  batchCalls,
  0,
  "uma conta existente com senha não deve ser sobrescrita pelo secret de bootstrap",
);

await bootstrapAdmin(fakeDb as never, {
  ADMIN_EMAIL: existingUser.email,
  ADMIN_INITIAL_PASSWORD: bootstrapPassword,
  ADMIN_FORCE_PASSWORD_RESET: "true",
});
assert.equal(
  batchCalls,
  1,
  "a flag explícita deve permitir somente a migração controlada de uma conta existente",
);

const bootstrapSource = readFileSync(
  new URL("../../functions/api/auth/_shared.ts", import.meta.url),
  "utf8",
);
assert.match(bootstrapSource, /must_change_password = 1/);
assert.match(bootstrapSource, /VALUES \(\?, \?, \?, 'admin', 1, \?, 1, 0/);
console.log("✓ bootstrap administrativo exige flag explícita e troca da senha provisionada");
