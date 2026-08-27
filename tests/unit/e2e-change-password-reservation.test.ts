import assert from "node:assert/strict";
import { onRequestPost } from "../../functions/api/auth/change-password";

/**
 * A identidade E2E reservada é uma conta de máquina: seu ciclo de vida de
 * credencial é gerenciado exclusivamente pela rotação de
 * NEUROPED_E2E_PASSWORD, nunca pelo fluxo humano de /api/auth/change-password.
 * Esse endpoint emite uma sessão nova (access + refresh) sem os guards
 * atômicos de clinic_membership usados em login/refresh; a sentinela deve
 * ser rejeitada antes de qualquer acesso a D1.
 */

function contextFor(email: string, envOverrides: Record<string, unknown> = {}) {
  return {
    env: { DB: {}, ...envOverrides },
    data: {
      authUser: {
        id: "e2e-1",
        email,
        name: "Sentinela",
        role: "reader",
        mustChangePassword: false,
      },
    },
    request: new Request("https://neuroped.test/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: "irrelevante", newPassword: "irrelevante" }),
    }),
  };
}

// Identidade E2E reservada: rejeitada antes de qualquer acesso a D1/segredo.
{
  const response = await onRequestPost(
    contextFor("e2e@example.com", { NEUROPED_E2E_EMAIL: "e2e@example.com" }) as never,
  );
  assert.equal(response.status, 403, "troca de senha da identidade E2E deve ser rejeitada");
  const body = (await response.json()) as { code?: string };
  assert.equal(body.code, "E2E_ACCOUNT_RESERVED");
}

// Sem NEUROPED_E2E_EMAIL configurado, a reserva não se aplica: o handler
// segue para a validação normal (que falha por falta de segredo configurado
// neste teste, não pela reserva).
{
  const response = await onRequestPost(contextFor("e2e@example.com", {}) as never);
  assert.notEqual(
    response.status,
    403,
    "sem NEUROPED_E2E_EMAIL configurado, a guarda de reserva não deve disparar",
  );
}

// Usuário humano comum nunca é afetado pela reserva.
{
  const response = await onRequestPost(
    contextFor("humano@example.com", { NEUROPED_E2E_EMAIL: "e2e@example.com" }) as never,
  );
  assert.notEqual(
    response.status,
    403,
    "e-mail humano diferente da identidade reservada não deve ser bloqueado",
  );
}

console.log("✓ troca de senha rejeita a identidade E2E reservada antes de qualquer acesso a D1");
