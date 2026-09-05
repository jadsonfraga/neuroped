/**
 * Contrato do verificador de prontidão comercial (GET /api/admin/go-live).
 *
 * Dois modos de falha, ambos silenciosos:
 *
 * 1. **O verificador vaza o que verifica.** Alguém acrescenta o prefixo da
 *    chave "só para conferir se é a certa" e a resposta passa a carregar
 *    material de segredo. Este teste executa o handler com segredos
 *    reconhecíveis e varre a resposta inteira atrás deles.
 *
 * 2. **O verificador mente sobre a ordem.** Cadastro aberto sem entrega de
 *    e-mail não é "quase pronto": é pior que fechado, porque cria contas que
 *    nunca conseguem criar clínica. Precisa ser sinalizado como perigoso.
 *
 * Roda o handler REAL, não uma cópia da lógica.
 *
 * Rodar: node --import tsx tests/unit/go-live-readiness.test.ts
 */
import assert from "node:assert/strict";
import { onRequestGet } from "../../functions/api/admin/go-live";

import { randomBytes } from "node:crypto";

/**
 * Fixtures geradas em tempo de execução, não literais: (1) o guard
 * audit-access-policy reprova — corretamente — qualquer literal atribuído a
 * NEUROPED_JWT_SECRET no código-fonte; (2) um valor aleatório por execução
 * torna a varredura de vazamento mais forte, porque nenhum trecho da resposta
 * pode coincidir com ele por acaso.
 */
const sentinela = (rotulo: string) => `${rotulo}_${randomBytes(24).toString("hex")}`;
const SEGREDOS = {
  AUTH_RESEND_API_KEY: sentinela("re"),
  ASAAS_API_KEY: sentinela("asaas"),
  ASAAS_WEBHOOK_TOKEN: sentinela("webhook"),
  NEUROPED_JWT_SECRET: sentinela("jwt"),
};

const ADMIN = { id: "u-admin", name: "Admin", email: "admin@x.invalid", role: "admin" };
const PROFISSIONAL = { ...ADMIN, id: "u-pro", role: "professional" };

function chamar(env: Record<string, unknown>, authUser: unknown) {
  return onRequestGet({
    env,
    data: { authUser },
    request: new Request("https://x.invalid/api/admin/go-live"),
  } as never);
}

const AMBIENTE_COMPLETO = {
  DB: {} as never,
  ...SEGREDOS,
  AUTH_PUBLIC_APP_URL: "https://neuroped.pages.dev",
  AUTH_EMAIL_FROM: "nao-responda@neuroped.invalid",
  ASAAS_ENVIRONMENT: "sandbox",
  SAAS_SIGNUP_ENABLED: "true",
};

// 1) Sem sessão e sem admin, a rota não conta nada sobre a instalação.
{
  const anonimo = await chamar(AMBIENTE_COMPLETO, null);
  assert.equal(anonimo.status, 401, "anônimo precisa receber 401");
  const proibido = await chamar(AMBIENTE_COMPLETO, PROFISSIONAL);
  assert.equal(proibido.status, 403, "papel não-admin precisa receber 403");
  const corpo = await proibido.text();
  assert.doesNotMatch(
    corpo,
    /gates|pendencias|pronto/,
    "a negativa não pode revelar o formato nem o estado da configuração",
  );
}

// 2) Ambiente completo: pronto, e NENHUM segredo na resposta.
{
  const resposta = await chamar(AMBIENTE_COMPLETO, ADMIN);
  assert.equal(resposta.status, 200);
  const texto = await resposta.text();

  for (const [nome, valor] of Object.entries(SEGREDOS)) {
    assert.ok(!texto.includes(valor), `${nome} inteiro vazou na resposta`);
    // Prefixo de 8 caracteres: pega o "só os primeiros dígitos para conferir".
    assert.ok(
      !texto.includes(valor.slice(0, 8)),
      `prefixo de ${nome} vazou na resposta — nem fragmento pode sair daqui`,
    );
  }

  const corpo = JSON.parse(texto);
  assert.equal(corpo.pronto, true, "ambiente completo precisa reportar pronto");
  assert.equal(corpo.ordemInvertida, false);
  assert.deepEqual(corpo.pendencias, []);
}

// 3) Cada gate ausente vira pendência nomeada — o operador sabe o que falta.
{
  const semEmail = await chamar(
    { ...AMBIENTE_COMPLETO, AUTH_RESEND_API_KEY: undefined },
    ADMIN,
  );
  const corpo = await semEmail.json() as { pendencias: string[]; ordemInvertida: boolean };
  assert.ok(corpo.pendencias.includes("ENTREGA_EMAIL_NAO_CONFIGURADA"));

  // 4) …e este caso específico é PERIGOSO, não apenas incompleto: o cadastro
  //    está aberto e a confirmação de posse não sai.
  assert.equal(
    corpo.ordemInvertida,
    true,
    "cadastro aberto sem entrega de e-mail precisa ser sinalizado como ordem invertida",
  );
}

// 5) http:// não passa por HTTPS — link de verificação interceptável.
{
  const inseguro = await chamar(
    { ...AMBIENTE_COMPLETO, AUTH_PUBLIC_APP_URL: "http://neuroped.pages.dev" },
    ADMIN,
  );
  const corpo = await inseguro.json() as { pendencias: string[] };
  assert.ok(
    corpo.pendencias.includes("ENTREGA_EMAIL_NAO_CONFIGURADA"),
    "base URL em http precisa reprovar a entrega de e-mail",
  );
}

// 6) Token de webhook curto reprova: o provider compara 32+ em tempo constante.
{
  const curto = await chamar(
    { ...AMBIENTE_COMPLETO, ASAAS_WEBHOOK_TOKEN: "curto" },
    ADMIN,
  );
  const corpo = await curto.json() as { pendencias: string[] };
  assert.ok(corpo.pendencias.includes("COBRANCA_NAO_CONFIGURADA"));
}

console.log(
  "✅ go-live: restrito a admin, nenhum segredo (nem prefixo) na resposta, pendências nomeadas e ordem invertida sinalizada como perigo.",
);
