import assert from "node:assert/strict";
import {
  bootstrapAdmin,
  bootstrapE2EAccount,
} from "../../functions/api/auth/_shared";
import { hashPassword } from "../../functions/api/auth/_crypto";

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
console.log("✓ bootstrap administrativo exige flag explícita para migração");

function e2eDb(existing: typeof existingUser | null) {
  const runs: Array<{ sql: string; binds: unknown[] }> = [];
  const batches: unknown[][] = [];
  return {
    runs,
    batches,
    db: {
      prepare(sql: string) {
        return {
          bind(...binds: unknown[]) {
            return {
              async first() {
                return sql.includes("FROM users") ? existing : null;
              },
              async run() {
                runs.push({ sql, binds });
                return { success: true, meta: { changes: 1 } };
              },
            };
          },
        };
      },
      async batch(statements: unknown[]) {
        batches.push(statements);
        return [];
      },
    },
  };
}

const e2ePassword = "senha-tecnica-e2e-123";

// Sem o par técnico, o bootstrap permanece no-op e nunca recorre a ADMIN_*.
{
  const { db, runs, batches } = e2eDb(null);
  await bootstrapE2EAccount(db as never, {});
  assert.equal(runs.length, 0);
  assert.equal(batches.length, 0);
}

// Ambiente novo: cria somente a conta sentinela com role mínima e sem troca nominal.
{
  const { db, runs, batches } = e2eDb(null);
  await bootstrapE2EAccount(db as never, {
    NEUROPED_E2E_EMAIL: "novo-e2e@example.com",
    NEUROPED_E2E_PASSWORD: e2ePassword,
  });
  assert.equal(batches.length, 0);
  assert.equal(runs.length, 1, "conta E2E ausente deve ser criada uma única vez");
  assert.match(runs[0].sql, /INSERT INTO users/);
  assert.match(runs[0].sql, /'reader'/, "conta E2E deve nascer com role mínima");
  assert.match(runs[0].sql, /, 0, 0, \?, \?\)/, "conta de máquina não exige troca de senha");
  assert.ok(runs[0].binds.includes("novo-e2e@example.com"));
}

// Secret inalterado: nenhuma escrita nem revogação de sessão.
{
  const currentHash = await hashPassword(e2ePassword);
  const currentE2E = {
    ...existingUser,
    id: "e2e-1",
    email: "e2e@example.com",
    role: "reader",
    password_hash: currentHash,
  };
  const { db, runs, batches } = e2eDb(currentE2E);
  await bootstrapE2EAccount(db as never, {
    NEUROPED_E2E_EMAIL: currentE2E.email,
    NEUROPED_E2E_PASSWORD: e2ePassword,
  });
  assert.equal(runs.length, 0);
  assert.equal(batches.length, 0, "bootstrap E2E idempotente não deve tocar conta pronta");
}

// Rotação do secret: atualiza exclusivamente a conta técnica e revoga sessões antigas.
{
  const oldHash = await hashPassword("senha-tecnica-antiga-123");
  const staleE2E = {
    ...existingUser,
    id: "e2e-2",
    email: "e2e-rotate@example.com",
    role: "reader",
    password_hash: oldHash,
  };
  const { db, batches } = e2eDb(staleE2E);
  await bootstrapE2EAccount(db as never, {
    NEUROPED_E2E_EMAIL: staleE2E.email,
    NEUROPED_E2E_PASSWORD: e2ePassword,
  });
  assert.equal(batches.length, 1, "rotação E2E deve ser aplicada atomicamente");
  assert.equal(batches[0].length, 2, "rotação deve atualizar senha e revogar refresh sessions");
}

console.log("✓ bootstrap E2E cria, preserva e rotaciona a conta técnica sem fallback ADMIN");