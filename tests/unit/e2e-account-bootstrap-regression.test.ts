import assert from "node:assert/strict";
import { bootstrapE2EAccount } from "../../functions/api/auth/_shared";

const existingUser = {
  id: "e2e-1",
  name: "Conta técnica E2E",
  email: "e2e@example.com",
  role: "reader",
  is_active: 1,
  password_hash:
    "pbkdf2$sha256$100000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  must_change_password: 0,
  failed_login_attempts: 0,
  locked_until: null,
};

function fakeDb(existing: unknown) {
  const inserted: { sql: string; binds: unknown[] }[] = [];
  return {
    inserted,
    db: {
      prepare(sql: string) {
        return {
          bind(...binds: unknown[]) {
            return {
              async first() {
                return sql.includes("FROM users") ? existing : null;
              },
              async run() {
                inserted.push({ sql, binds });
                return { success: true, meta: { changes: 1 } };
              },
            };
          },
        };
      },
    },
  };
}

// Sem as duas variáveis, o bootstrap é um no-op silencioso (conta permanece opcional).
{
  const { db, inserted } = fakeDb(null);
  await bootstrapE2EAccount(db as never, {});
  assert.equal(inserted.length, 0, "sem NEUROPED_E2E_EMAIL/PASSWORD, nada deve ser inserido");
}

// Conta já existente nunca é sobrescrita — mesmo padrão do bootstrap do admin.
{
  const { db, inserted } = fakeDb(existingUser);
  await bootstrapE2EAccount(db as never, {
    NEUROPED_E2E_EMAIL: existingUser.email,
    NEUROPED_E2E_PASSWORD: "senha-tecnica-e2e-123",
  });
  assert.equal(inserted.length, 0, "conta E2E existente não deve ser recriada nem ter a senha trocada");
}

// Conta ausente: cria com role mínima e sem exigir troca de senha (conta de máquina).
{
  const { db, inserted } = fakeDb(null);
  await bootstrapE2EAccount(db as never, {
    NEUROPED_E2E_EMAIL: "novo-e2e@example.com",
    NEUROPED_E2E_PASSWORD: "senha-tecnica-e2e-123",
  });
  assert.equal(inserted.length, 1, "conta E2E ausente deve ser criada uma única vez");
  const [{ sql, binds }] = inserted;
  assert.match(sql, /INSERT INTO users/);
  assert.match(sql, /'reader'/, "conta E2E deve nascer com a role mínima 'reader'");
  assert.ok(
    binds.includes("novo-e2e@example.com"),
    "e-mail da conta técnica deve ser gravado normalizado",
  );
}

console.log("✓ bootstrap da conta E2E é idempotente, opcional e nunca sobrescreve senha existente");
