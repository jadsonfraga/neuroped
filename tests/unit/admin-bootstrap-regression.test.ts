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
  directRunChanges = 1,
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
                return { success: true, meta: { changes: directRunChanges } };
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

// No e-mail técnico, senha diferente do secret é rejeitada — nunca cai no login humano.
{
  const { db, runs, batches } = e2eDb(null);
  await assert.rejects(
    bootstrapE2EAccount(
      db as never,
      {
        NEUROPED_E2E_EMAIL: "novo-e2e@example.com",
        NEUROPED_E2E_PASSWORD: e2ePassword,
      },
      "senha-incorreta",
    ),
    /E2E_CREDENTIAL_MISMATCH/,
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

// Sentinela pronta ainda passa por guarda atômica de ausência de membership.
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
  assert.equal(runs.length, 1, "sentinela pronta deve validar atomicamente ausência de membership");
  assert.match(runs[0].sql, /NOT EXISTS[\s\S]*clinic_memberships/);
  assert.equal(batches.length, 0, "sentinela pronta não deve rotacionar senha nem sessões");
}

// Ready-path TOCTOU: membership criada antes da guarda atômica deve abortar login.
{
  const currentHash = await hashPassword(e2ePassword);
  const currentE2E = {
    ...existingUser,
    id: "e2e-ready-race",
    email: "e2e-ready-race@example.com",
    role: "reader",
    password_hash: currentHash,
  };
  const { db, runs } = e2eDb(currentE2E, false, 1, 0);
  await assert.rejects(
    bootstrapE2EAccount(
      db as never,
      {
        NEUROPED_E2E_EMAIL: currentE2E.email,
        NEUROPED_E2E_PASSWORD: e2ePassword,
      },
      e2ePassword,
    ),
    /E2E_ACCOUNT_MEMBERSHIP_RACE/,
  );
  assert.equal(runs.length, 1);
  assert.match(runs[0].sql, /NOT EXISTS[\s\S]*clinic_memberships/);
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
  await assert.rejects(
    bootstrapE2EAccount(
      wrong.db as never,
      {
        NEUROPED_E2E_EMAIL: lockedE2E.email,
        NEUROPED_E2E_PASSWORD: e2ePassword,
      },
      "senha-incorreta",
    ),
    /E2E_CREDENTIAL_MISMATCH/,
  );
  assert.equal(wrong.batches.length, 0, "senha errada não pode limpar lockout E2E");
  assert.equal(wrong.runs.length, 0, "senha errada não pode tocar a conta técnica");

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

// TOCTOU na rotação: membership criada entre o SELECT e o UPDATE zera changes e aborta.
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

// A fronteira de login reserva o e-mail E2E e nunca permite fallback para senha humana.
{
  const loginSource = readFileSync("functions/api/auth/login.ts", "utf8");
  assert.match(
    loginSource,
    /if \(!e2ePassword \|\| password !== e2ePassword\) \{[\s\S]*return json\(INVALID, 401\);/,
    "senha diferente do secret no e-mail E2E deve ser rejeitada antes do login normal",
  );
  assert.match(
    loginSource,
    /await bootstrapE2EAccount\(env\.DB, env, password\);\s*\} catch \{\s*return json\(INVALID, 401\);/s,
    "falha do bootstrap E2E deve encerrar autenticação com resposta genérica",
  );
}

// As duas rotas runtime que vinculam usuário existente a clínica bloqueiam a identidade E2E.
{
  const membersSource = readFileSync("functions/api/tenants/[id]/members.ts", "utf8");
  const acceptSource = readFileSync("functions/api/billing/accept.ts", "utf8");
  for (const [name, source] of [
    ["tenants.members", membersSource],
    ["billing.accept", acceptSource],
  ] as const) {
    assert.match(source, /NEUROPED_E2E_EMAIL/, `${name} deve receber a identidade E2E reservada`);
    assert.match(source, /TECHNICAL_ACCOUNT_RESERVED/, `${name} deve rejeitar explicitamente a conta técnica`);
    assert.match(
      source,
      /NOT EXISTS[\s\S]*users u[\s\S]*lower\(u\.email\)/,
      `${name} deve revalidar a identidade reservada no próprio write`,
    );
  }
}

// Famílias de refresh emitidas antes da reserva também não podem manter uma identidade humana colidida.
{
  const refreshSource = readFileSync("functions/api/auth/refresh.ts", "utf8");
  assert.match(refreshSource, /NEUROPED_E2E_EMAIL/);
  assert.match(refreshSource, /FROM clinic_memberships/);
  assert.match(refreshSource, /user\.role !== "reader" \|\| membership/);
  assert.match(
    refreshSource,
    /revokeRefreshToken\(env\.DB, payload, token, "account_disabled"\)/,
    "refresh legado da identidade E2E inválida deve revogar a família antes de rotacionar",
  );
}

console.log(
  "✓ bootstrap E2E reserva identidade, protege memberships/ready-path, fecha TOCTOU e revoga refresh legado colidido",
);