/**
 * Contrato do transporte de e-mail transacional e da entrega do convite.
 *
 * Três modos de falha, todos silenciosos:
 *
 * 1. **Um fluxo volta a falar direto com o provedor.** Foi assim que o convite
 *    ficou manual: ninguém quis duplicar o `fetch` uma terceira vez, então o
 *    link passou a ser devolvido ao gestor "para ele enviar". O contrato exige
 *    que `api.resend.com` apareça em UM arquivo só.
 *
 * 2. **O link do convite volta ao convidante mesmo com e-mail configurado.**
 *    É o vetor que a revisão adversarial de 03/09 nomeou: com o token em mãos,
 *    o convidante cria a conta em nome de um terceiro e trava o cadastro
 *    legítimo daquela pessoa.
 *
 * 3. **A degradação vira silêncio.** Sem transporte, o convite ainda precisa
 *    funcionar — mas rotulado como manual, nunca fingindo que enviou.
 *
 * Rodar: node --import tsx tests/unit/mail-transport-contract.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  mailTransportConfigured,
  publicAppBaseUrl,
  sendTransactionalEmail,
} from "../../functions/api/auth/_mailTransport";
import { invitationDeliveryMode } from "../../functions/api/billing/_invitationDelivery";

const CONFIGURADO = {
  AUTH_PUBLIC_APP_URL: "https://app.neuroped.test",
  AUTH_RESEND_API_KEY: "chave-de-teste-nao-real",
  AUTH_EMAIL_FROM: "NeuroPed <no-reply@neuroped.test>",
};

// 1) Um único arquivo pode falar com o provedor.
{
  const arquivos: string[] = [];
  const varrer = (dir: string) => {
    for (const entrada of readdirSync(dir, { withFileTypes: true })) {
      const caminho = join(dir, entrada.name);
      if (entrada.isDirectory()) varrer(caminho);
      else if (entrada.name.endsWith(".ts")) arquivos.push(caminho);
    }
  };
  varrer("functions");
  const comProvedor = arquivos.filter((caminho) =>
    readFileSync(caminho, "utf8").includes("api.resend.com"),
  );
  assert.deepEqual(
    comProvedor,
    ["functions/api/auth/_mailTransport.ts"],
    "só o transporte pode falar com o provedor — um fluxo com fetch próprio é um fluxo que diverge",
  );
}

// 2) HTTPS é obrigatório: todo e-mail carrega token de uso único.
{
  assert.equal(publicAppBaseUrl({ AUTH_PUBLIC_APP_URL: "http://app.test" }), null);
  assert.equal(publicAppBaseUrl({ AUTH_PUBLIC_APP_URL: "nao-e-url" }), null);
  assert.equal(publicAppBaseUrl({ AUTH_PUBLIC_APP_URL: undefined }), null);
  assert.equal(
    publicAppBaseUrl({ AUTH_PUBLIC_APP_URL: "https://app.neuroped.test/" }),
    "https://app.neuroped.test",
  );
  assert.equal(mailTransportConfigured({ ...CONFIGURADO, AUTH_PUBLIC_APP_URL: "http://x.test" }), false);
  assert.equal(mailTransportConfigured(CONFIGURADO), true);
  assert.equal(mailTransportConfigured({ ...CONFIGURADO, AUTH_RESEND_API_KEY: "  " }), false);
  // Transporte desconhecido não vira "melhor esforço no padrão": fail-closed.
  assert.equal(
    mailTransportConfigured({ ...CONFIGURADO, AUTH_EMAIL_TRANSPORT: "provedor-inexistente" }),
    false,
  );
}

// 3) Sem configuração o transporte NÃO chama a rede e devolve false.
{
  const realFetch = globalThis.fetch;
  let chamou = false;
  globalThis.fetch = (async () => {
    chamou = true;
    return new Response("{}", { status: 200 });
  }) as typeof fetch;
  const entregue = await sendTransactionalEmail(
    { AUTH_PUBLIC_APP_URL: "https://app.test" },
    { to: "x@y.test", subject: "s", text: "t" },
  );
  globalThis.fetch = realFetch;
  assert.equal(entregue, false);
  assert.equal(chamou, false, "sem configuração não pode haver requisição ao provedor");
}

// 4) Erro de rede não sobe para o chamador: o fluxo decide fail-closed com o
//    booleano, em vez de estourar no meio de uma transação.
{
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new Error("rede indisponível");
  }) as typeof fetch;
  const entregue = await sendTransactionalEmail(CONFIGURADO, {
    to: "x@y.test",
    subject: "s",
    text: "t",
  });
  globalThis.fetch = realFetch;
  assert.equal(entregue, false, "falha de rede vira false, nunca exceção");
}

// 5) O modo de entrega do convite segue o transporte.
{
  assert.equal(invitationDeliveryMode(CONFIGURADO), "email");
  assert.equal(invitationDeliveryMode({}), "manual");
}

// 6) O handler de convites nunca devolve o link quando entregou por e-mail.
{
  const fonte = readFileSync("functions/api/billing/invitations.ts", "utf8");
  assert.match(
    fonte,
    /return sent \? \{ delivery: "email" \} : \{ delivery: "manual", invitationUrl: params\.invitationUrl \}/,
    "com entrega por e-mail a resposta não pode conter invitationUrl",
  );
  // Nenhum retorno pode espalhar `invitationUrl` fora do objeto de entrega.
  const retornosComUrl = [...fonte.matchAll(/tenantJson\(\{[\s\S]*?\}/g)].filter((m) =>
    /\binvitationUrl,/.test(m[0]),
  );
  assert.equal(
    retornosComUrl.length,
    0,
    "invitationUrl só pode sair pelo objeto de entrega, que o omite quando o e-mail saiu",
  );
}

// 7) A tela precisa dizer a verdade sobre qual dos dois aconteceu.
{
  const tela = readFileSync("client/src/pages/configuracoes.tsx", "utf8");
  assert.match(tela, /body\.delivery === "email"/, "a tela precisa ler o modo de entrega real");
  assert.match(
    tela,
    /Entrega por e-mail não configurada nesta instalação/,
    "no modo manual a tela precisa dizer que a entrega não está configurada",
  );
}

console.log(
  "✅ transporte de e-mail: provedor isolado em um arquivo, HTTPS obrigatório, fail-closed sem configuração e sem exceção na rede; convite entregue por e-mail não devolve link ao convidante.",
);
