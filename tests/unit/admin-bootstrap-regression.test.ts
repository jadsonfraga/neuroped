import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

type BoundStatement = {
  __sql: string;
  __binds: unknown[];
  first: () => Promise<unknown>;
  run: () => Promise<{ success: boolean; meta: { changes: number } }>;
};

function e2eDb(
  existing: typeof existingUser | null,
  hasMembership = false,
  conditionalUpdateChanges = 1,
) {
  const runs: Array<{ sql: string; binds: unknown[] }> = [];
  const batches: BoundStatement[][] = [];
  return {
    runs,
    batches,
    db: {
      prepare(sql: string) {
        return {
          bind(...binds: unknown[]): BoundStatement {
            return {
              __sql: sql,
              __binds: binds,
              async first() {
                if (sql.includes("FROM users")) return existing;
                if (sql.includes("FROM clinic_memberships")) {
                  return hasMembership ? { has_membership: 1 } : null;
                }
                return null;
              },
              async run() {
                runs.push({ sql, binds });
                return { success: true, meta: { changes: 1 } };
              },
            };
          },
        };
      },
      async batch(statements: BoundStatement[]) {
        batches.push(statements);
        return statements.map((_statement, index) => ({
          success: true,
          meta: { changes: index === 0 ? conditionalUpdateChanges : 1 },
        }));
      },
    },
  };
}

const e2ePassword = "senha-tecnica-e2e-123";

// Sem o par técnico, o bootstrap permanece no-op e nunca recorre a ADMIN_*.
{
  const { db, runs, batches } = e2eDb(null);
  await bootstrapE2EAccount(db as never, {}, e2ePassword);
  assert.equal(runs.length, 0);
  assert.equal(batches.length, 0);
}

// Uma tentativa com senha errada jamais cria, destrava ou rotaciona a sentinela.
{
  const { db, runs, batches } = e2eDb(null);
  await bootstrapE2EAccount(
    db as never,
    {
      NEUROPED_E2E_EMAIL: "novo-e2e@example.com",
      NEUROPED_E2E_PASSWORD: e2ePassword,
    },
    "senha-incorreta",
  );
  assert.equal(runs.length, 0);
  assert.equal(batches.length, 0);
}

// O sentinela nunca pode compartilhar identidade com o bootstrap administrativo.
{
  const { db } = e2eDb(null);
  await assert.rejects(
    bootstrapE2EAccount(
      db as never,
      {
        ADMIN_EMAIL: "same@example.com",
        NEUROPED_E2E_EMAIL: "same@example.com",
        NEUROPED_E2E_PASSWORD: e2ePassword,
      },
      e2ePassword,
    ),
    /E2E_ACCOUNT_COLLIDES_WITH_ADMIN/,
  );
}

// Uma conta humana/privilegiada preexistente não pode ser convertida em sentinela.
{
  const privileged = {
    ...existingUser,
    id: "human-1",
    email: "human@example.com",
    role: "admin",
  };
  const { db, runs, batches } = e2eDb(privileged);
  await assert.rejects(
    bootstrapE2EAccount(
      db as never,
      {
        NEUROPED_E2E_EMAIL: privileged.email,
        NEUROPED_E2E_PASSWORD: e2ePassword,
      },
      e2ePassword,
    ),
    /E2E_ACCOUNT_ROLE_INVALID/,
  );
  assert.equal(runs.length, 0);
  assert.equal(batches.length, 0);
}

// Role global `reader` não basta: qualquer membership clínica bloqueia captura.
{
  const tenantMember = {
    ...existingUser,
    id: "human-reader-1",
    email: "reader@example.com",
    role: "reader",
  };
  const { db, runs, batches } = e2eDb(tenantMember, true);
  await assert.rejects(
    bootstrapE2EAccount(
      db as never,
      {
        NEUROPED_E2E_EMAIL: tenantMember.email,
        NEUROPED_E2E_PASSWORD: e2ePassword,
      },
      e2ePassword,
    ),
    /E2E_ACCOUNT_HAS_CLINIC_MEMBERSHIP/,
  );
  assert.equal(runs.length, 0);
  assert.equal(batches.length, 0);
}

// Ambiente novo: cria somente a conta sentinela com role mínima e sem troca nominal.
{
  const { db, runs, batches } = e2eDb(null);
  await bootstrapE2EAccount(
    db as never,
    {
      NEUROPED_E2E_EMAIL: "novo-e2e@example.com",
      NEUROPED_E2E_PASSWORD: e2ePassword,
    },
    e2ePassword,
  );
  assert.equal(batches.length, 0);
  assert.equal(runs.length, 1, "conta E2E ausente deve ser criada uma única vez");
  assert.match(runs[0].sql, /INSERT INTO users/);
  assert.match(runs[0].sql, /'reader'/, "conta E2E deve nascer com role mínima");
  assert.match(runs[0].sql, /, 0, 0, \?, \?\)/, "conta de máquina não exige troca de senha");
  assert.ok(runs[0].binds.includes("novo-e2e@example.com"));
}

// Secret inalterado e conta desbloqueada: nenhuma escrita nem revogação de sessão.
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
  await bootstrapE2EAccount(
    db as never,
    {
      NEUROPED_E2E_EMAIL: currentE2E.email,
      NEUROPED_E2E_PASSWORD: e2ePassword,
    },
    e2ePassword,
  );
  assert.equal(runs.length, 0);
  assert.equal(batches.length, 0, "bootstrap E2E idempotente não deve tocar conta pronta");
}

// Lockout ativo só é recuperado pela credencial técnica correta.
{
  const currentHash = await hashPassword(e2ePassword);
  const lockedE2E = {
    ...existingUser,
    id: "e2e-locked",
    email: "e2e-locked@example.com",
    role: "reader",
    password_hash: currentHash,
    failed_login_attempts: 5,
    locked_until: new Date(Date.now() + 15 * 60_000).toISOString(),
  };

  const wrong = e2eDb(lockedE2E);
  await bootstrapE2EAccount(
    wrong.db as never,
    {
      NEUROPED_E2E_EMAIL: lockedE2E.email,
      NEUROPED_E2E_PASSWORD: e2ePassword,
    },
    "senha-incorreta",
  );
  assert.equal(wrong.batches.length, 0, "senha errada não pode limpar lockout E2E");

  const correct = e2eDb(lockedE2E);
  await bootstrapE2EAccount(
    correct.db as never,
    {
      NEUROPED_E2E_EMAIL: lockedE2E.email,
      NEUROPED_E2E_PASSWORD: e2ePassword,
    },
    e2ePassword,
  );
  assert.equal(correct.batches.length, 1, "senha E2E correta deve recuperar lockout técnico");
  assert.equal(correct.batches[0].length, 2, "recuperação deve limpar estado e revogar sessões antigas");
  assert.match(correct.batches[0][0].__sql, /NOT EXISTS[\s\S]*clinic_memberships/);
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
  await bootstrapE2EAccount(
    db as never,
    {
      NEUROPED_E2E_EMAIL: staleE2E.email,
      NEUROPED_E2E_PASSWORD: e2ePassword,
    },
    e2ePassword,
  );
  assert.equal(batches.length, 1, "rotação E2E deve ser aplicada atomicamente");
  assert.equal(batches[0].length, 2, "rotação deve atualizar senha e revogar refresh sessions");
  assert.match(batches[0][0].__sql, /role = 'reader'/);
  assert.match(batches[0][0].__sql, /NOT EXISTS[\s\S]*clinic_memberships/);
}

// TOCTOU: membership criada entre o SELECT inicial e o UPDATE deve zerar changes e abortar.
{
  const oldHash = await hashPassword("senha-tecnica-antiga-race");
  const racingE2E = {
    ...existingUser,
    id: "e2e-race",
    email: "e2e-race@example.com",
    role: "reader",
    password_hash: oldHash,
  };
  const { db, batches } = e2eDb(racingE2E, false, 0);
  await assert.rejects(
    bootstrapE2EAccount(
      db as never,
      {
        NEUROPED_E2E_EMAIL: racingE2E.email,
        NEUROPED_E2E_PASSWORD: e2ePassword,
      },
      e2ePassword,
    ),
    /E2E_ACCOUNT_MEMBERSHIP_RACE/,
  );
  assert.equal(batches.length, 1, "a corrida deve chegar ao write condicional uma única vez");
  assert.match(batches[0][0].__sql, /NOT EXISTS[\s\S]*clinic_memberships/);
}

// Rejeições de identidade E2E não podem ser engolidas e cair no login humano normal.
{
  const loginSource = readFileSync("functions/api/auth/login.ts", "utf8");
  assert.match(
    loginSource,
    /await bootstrapE2EAccount\(env\.DB, env, password\);\s*\} catch \{\s*return json\(INVALID, 401\);/s,
    "falha do bootstrap E2E deve encerrar autenticação com resposta genérica",
  );
}

console.log(
  "✓ bootstrap E2E cria, preserva, protege memberships, fecha TOCTOU e recupera/rotaciona com credencial válida",
);
