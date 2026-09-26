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

// 7) "pronto" atesta configuração presente — e diz isso. A escada comercial
//    (credencial validada, entrega comprovada, sandbox exercitado, produção
//    verificada, aceite humano) NÃO é atestada por esta rota, e a resposta
//    precisa nomear cada degrau que falta, para que pronto=true nunca seja
//    lido como autorização de venda.
{
  const resposta = await chamar(AMBIENTE_COMPLETO, ADMIN);
  const corpo = await resposta.json() as {
    pronto: boolean;
    nivelAtestado: string;
    ambienteCobranca: string | null;
    naoComprova: string[];
    nota: string;
  };
  assert.equal(corpo.pronto, true, "compatibilidade: pronto não muda de semântica");
  assert.equal(corpo.nivelAtestado, "CONFIGURACAO_PRESENTE");
  assert.equal(corpo.ambienteCobranca, "sandbox", "o rótulo do ambiente é código operacional, não segredo");
  for (const degrau of [
    "CREDENCIAL_VALIDADA_NO_PROVEDOR",
    "ENTREGA_EMAIL_COMPROVADA",
    "INTEGRACAO_SANDBOX_EXERCITADA",
    "PRODUCAO_VERIFICADA",
    "ACEITE_COMERCIAL_HUMANO",
  ]) {
    assert.ok(corpo.naoComprova.includes(degrau), `naoComprova precisa listar ${degrau}`);
  }
  assert.match(corpo.nota, /não autoriza venda/i, "a nota precisa negar a leitura comercial de pronto=true");

  // Ambiente de cobrança inválido nunca é ecoado: só os dois códigos ou null.
  const invalido = await chamar({ ...AMBIENTE_COMPLETO, ASAAS_ENVIRONMENT: "outra-coisa" }, ADMIN);
  const corpoInvalido = await invalido.json() as { ambienteCobranca: string | null; pendencias: string[] };
  assert.equal(corpoInvalido.ambienteCobranca, null, "valor não reconhecido não pode ser ecoado");
  assert.ok(corpoInvalido.pendencias.includes("COBRANCA_NAO_CONFIGURADA"));
}

// 8) Não atestar configuração presente quando falta qualquer requisito.
//    Regressão: a PR #949 retornava o mesmo nível até para env vazio.
const NAO_COMPROVA = [
  "CREDENCIAL_VALIDADA_NO_PROVEDOR",
  "ENTREGA_EMAIL_COMPROVADA",
  "INTEGRACAO_SANDBOX_EXERCITADA",
  "PRODUCAO_VERIFICADA",
  "ACEITE_COMERCIAL_HUMANO",
];

type Diagnostico = {
  pronto: boolean;
  nivelAtestado: string;
  ambienteCobranca: string | null;
  naoComprova: string[];
  pendencias: string[];
  ordemInvertida: boolean;
  nota: string;
};

async function diagnostico(env: Record<string, unknown>): Promise<Diagnostico> {
  const resposta = await chamar(env, ADMIN);
  assert.equal(resposta.status, 200);
  assert.equal(resposta.headers.get("Cache-Control"), "no-store");
  return resposta.json() as Promise<Diagnostico>;
}

{
  const requisitos = [
    ["DB", "DB_BINDING_AUSENTE"],
    ["NEUROPED_JWT_SECRET", "JWT_SECRET_AUSENTE_OU_CURTO"],
    ["AUTH_PUBLIC_APP_URL", "ENTREGA_EMAIL_NAO_CONFIGURADA"],
    ["AUTH_RESEND_API_KEY", "ENTREGA_EMAIL_NAO_CONFIGURADA"],
    ["AUTH_EMAIL_FROM", "ENTREGA_EMAIL_NAO_CONFIGURADA"],
    ["ASAAS_API_KEY", "COBRANCA_NAO_CONFIGURADA"],
    ["ASAAS_WEBHOOK_TOKEN", "COBRANCA_NAO_CONFIGURADA"],
    ["ASAAS_ENVIRONMENT", "COBRANCA_NAO_CONFIGURADA"],
    ["SAAS_SIGNUP_ENABLED", "CADASTRO_SELF_SERVICE_FECHADO"],
  ] as const;
  for (const [campo, pendencia] of requisitos) {
    const corpo = await diagnostico({ ...AMBIENTE_COMPLETO, [campo]: undefined });
    assert.equal(corpo.pronto, false, `${campo}: compatibilidade preservada`);
    assert.equal(
      corpo.nivelAtestado,
      "CONFIGURACAO_INCOMPLETA",
      `${campo} ausente não pode atestar configuração presente`,
    );
    assert.ok(corpo.pendencias.includes(pendencia), `${campo}: pendência nomeada`);
    assert.deepEqual(corpo.naoComprova, NAO_COMPROVA);
  }
  const vazio = await diagnostico({});
  assert.equal(vazio.pronto, false);
  assert.equal(vazio.nivelAtestado, "CONFIGURACAO_INCOMPLETA");
  assert.equal(vazio.pendencias.length, 5);
  assert.equal(vazio.ambienteCobranca, null);
  assert.deepEqual(vazio.naoComprova, NAO_COMPROVA);
}

// 9) Nem escolher production com chaves fictícias comprova operação externa.
//    Ambiente ausente/inválido não é normalizado para um ambiente permitido.
{
  const invalido = sentinela("cfg");
  const ambientes: Array<[string | undefined, string | null]> = [
    ["sandbox", "sandbox"],
    [" SANDBOX ", "sandbox"],
    ["production", "production"],
    [" PRODUCTION ", "production"],
    [undefined, null],
    ["", null],
    [invalido, null],
  ];
  for (const [entrada, esperado] of ambientes) {
    const corpo = await diagnostico({ ...AMBIENTE_COMPLETO, ASAAS_ENVIRONMENT: entrada });
    assert.equal(corpo.ambienteCobranca, esperado);
    assert.equal(corpo.pronto, esperado !== null);
    assert.equal(
      corpo.nivelAtestado,
      esperado === null ? "CONFIGURACAO_INCOMPLETA" : "CONFIGURACAO_PRESENTE",
    );
    assert.deepEqual(corpo.naoComprova, NAO_COMPROVA);
    assert.match(corpo.nota, /não autoriza venda/i);
    const texto = JSON.stringify(corpo);
    for (const valor of [...Object.values(SEGREDOS), invalido]) {
      assert.ok(!texto.includes(valor), "valor de configuração não pode vazar");
      assert.ok(!texto.includes(valor.slice(0, 8)), "prefixo não pode vazar");
    }
  }
}

// 10) Negativas não revelam os novos campos. Isto testa o contrato do handler,
//     não substitui a validação de sessão feita pelo middleware em produção.
{
  for (const [usuario, status] of [
    [null, 401],
    [{ ...ADMIN, id: "" }, 401],
    [{ ...ADMIN, role: "desconhecido" }, 401],
    [PROFISSIONAL, 403],
    [{ ...ADMIN, role: "reader" }, 403],
    [{ ...ADMIN, role: "operator" }, 403],
  ] as const) {
    const resposta = await chamar(AMBIENTE_COMPLETO, usuario);
    assert.equal(resposta.status, status);
    assert.equal(resposta.headers.get("Cache-Control"), "no-store");
    assert.doesNotMatch(
      await resposta.text(),
      /gates|pendencias|pronto|nivelAtestado|ambienteCobranca|naoComprova/,
    );
  }
}

// 11) Inspeção de configuração não envia e-mail, cobra ou acessa o banco.
//     As sentinelas abaixo interceptam apenas fronteiras externas; handler e
//     autorização são reais. Nenhuma integração D1/provedor é alegada aqui.
{
  const fetchOriginal = globalThis.fetch;
  let chamadasExternas = 0;
  let acessosBanco = 0;
  globalThis.fetch = async () => {
    chamadasExternas += 1;
    throw new Error("diagnóstico de configuração não pode chamar provedor");
  };
  const dbSemEfeitos = new Proxy({}, {
    get() {
      acessosBanco += 1;
      throw new Error("diagnóstico de configuração não pode consultar ou gravar dados");
    },
  });
  try {
    for (const ambiente of ["sandbox", "production"]) {
      const corpo = await diagnostico({
        ...AMBIENTE_COMPLETO,
        DB: dbSemEfeitos,
        ASAAS_ENVIRONMENT: ambiente,
      });
      assert.equal(corpo.pronto, true);
      assert.equal(corpo.nivelAtestado, "CONFIGURACAO_PRESENTE");
      assert.deepEqual(corpo.naoComprova, NAO_COMPROVA);
    }
    assert.equal(chamadasExternas, 0);
    assert.equal(acessosBanco, 0);
  } finally {
    globalThis.fetch = fetchOriginal;
  }
}

console.log(
  "✅ go-live: restrito a admin, nenhum segredo (nem prefixo) na resposta, pendências nomeadas, ordem invertida sinalizada como perigo e nível atestado explícito — pronto=true não é autorização de venda.",
);
