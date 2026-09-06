/**
 * Contrato do transporte transacional e da entrega de convites.
 *
 * O link de convite contém bearer secret. A única degradação aceitável é
 * fail-closed: sem transporte HTTPS configurado, nenhum token deve ser criado,
 * rotacionado ou devolvido ao convidante.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  mailTransportConfigured,
  publicAppBaseUrl,
  sendTransactionalEmail,
} from "../../functions/api/auth/_mailTransport";
import { invitationDeliveryConfigured } from "../../functions/api/billing/_invitationDelivery";

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
    "só o transporte pode falar com o provedor",
  );
}

// 2) HTTPS e configuração completa são obrigatórios.
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
  assert.equal(
    mailTransportConfigured({ ...CONFIGURADO, AUTH_EMAIL_TRANSPORT: "provedor-inexistente" }),
    false,
  );
  assert.equal(invitationDeliveryConfigured(CONFIGURADO), true);
  assert.equal(invitationDeliveryConfigured({}), false);
}

// 3) Sem configuração o transporte não chama a rede e devolve false.
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

// 4) Erro de rede vira false; o handler decide a resposta fail-closed.
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

// 5) O handler não oferece fallback manual nem serializa o bearer URL.
{
  const fonte = readFileSync("functions/api/billing/invitations.ts", "utf8");
  assert.match(fonte, /INVITATION_DELIVERY_NOT_CONFIGURED/);
  assert.match(fonte, /INVITATION_EMAIL_DELIVERY_FAILED/);
  assert.doesNotMatch(fonte, /delivery:\s*["']manual["']/);
  assert.doesNotMatch(fonte, /invitationUrl:\s*params\.invitationUrl/);

  const preflight = fonte.indexOf("if (!invitationDeliveryConfigured(context.env))");
  const tokenGeneration = fonte.indexOf("const generated = await generateInvitationToken()");
  assert.ok(
    preflight >= 0 && tokenGeneration > preflight,
    "o transporte deve ser validado antes de gerar/rotacionar bearer token",
  );
}

console.log(
  "✅ transporte de e-mail: provedor isolado, HTTPS obrigatório e convites fail-closed sem exposição de bearer token.",
);
