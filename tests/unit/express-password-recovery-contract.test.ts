import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PASSWORD_RECOVERY_REMOTE_ONLY } from "../../server/auth/passwordRecoveryContract.ts";

// Missão 6 da espiral: paridade Express×Cloudflare do forgot-password foi
// resolvida por ARQUITETURA EXPLÍCITA — produção (Cloudflare Pages/D1) atende
// o fluxo completo; o Express local responde um contrato claro em vez do 404
// mudo que o botão "Esqueci minha senha" recebia. Este teste trava as duas
// metades da decisão.

// 1. O contrato é explícito, estável e não-enumerador.
assert.equal(PASSWORD_RECOVERY_REMOTE_ONLY.status, 503);
assert.equal(PASSWORD_RECOVERY_REMOTE_ONLY.body.code, "PASSWORD_RESET_REMOTE_ONLY");
assert.match(PASSWORD_RECOVERY_REMOTE_ONLY.body.error, /produção/);
// A mensagem só pode anunciar caminho local que EXISTE (achado Codex P1):
// o bootstrap force-reset, com paridade no canônico.
assert.match(PASSWORD_RECOVERY_REMOTE_ONLY.body.error, /ADMIN_FORCE_PASSWORD_RESET/);
assert.doesNotMatch(
  PASSWORD_RECOVERY_REMOTE_ONLY.body.error,
  /e-?mail não (existe|encontrado)|conta não/i,
  "mensagem não pode insinuar existência ou inexistência de conta",
);

// 2. O Express registra AMBOS os endpoints com o contrato — nunca mais 404 —
//    e não emite token nenhum (anti-enumeração por construção: nenhuma
//    consulta a users, nenhum token de reset neste runtime).
const routes = readFileSync("server/auth/routes.ts", "utf8");
assert.match(routes, /"\/api\/auth\/forgot-password"/);
assert.match(routes, /"\/api\/auth\/reset-password"/);
assert.match(routes, /PASSWORD_RECOVERY_REMOTE_ONLY/);
// Limiter PRÓPRIO (achado Codex P2): compartilhar o contador do login faria
// as respostas 503 trancarem o /login do mesmo IP pela janela inteira.
assert.match(routes, /app\.post\(path, passwordRecoveryRateLimit/);
assert.doesNotMatch(routes, /app\.post\(path, loginRateLimit/);
assert.doesNotMatch(
  routes,
  /reset_token|resetToken|password_reset_tokens/,
  "o Express não pode passar a emitir/consumir tokens de reset sem revisar a decisão de arquitetura (passwordRecoveryContract.ts)",
);

// 3. A produção continua dona do fluxo completo: os dois handlers Cloudflare
//    existem e mantêm as invariantes nucleares (202 genérico + token só em hash).
// 2b. O caminho local anunciado existe de verdade e com paridade canônica:
//     bootstrap force-reset no Express espelha functions/api/auth/_shared.ts
//     (mesma flag, mesmo marcador único, revogação de sessões).
const expressStorage = readFileSync("server/storage.ts", "utf8");
const cfShared = readFileSync("functions/api/auth/_shared.ts", "utf8");
for (const source of [expressStorage, cfShared]) {
  assert.match(source, /ADMIN_FORCE_PASSWORD_RESET/);
  assert.match(source, /auth\.admin\.bootstrap\.v2/);
}
assert.match(expressStorage, /revoked_at = \? WHERE user_id = \? AND revoked_at IS NULL/);

// 2c. Erro tipado no cliente (achado Codex P2): resposta do servidor exibe a
//     explicação; falha de transporte cai na mensagem genérica, nunca no
//     texto cru do navegador.
const recoveryClient = readFileSync("client/src/lib/passwordRecoveryClient.ts", "utf8");
assert.match(recoveryClient, /class PasswordRecoveryServerError extends Error/);
const forgotPage = readFileSync("client/src/pages/esqueci-senha.tsx", "utf8");
assert.match(forgotPage, /instanceof PasswordRecoveryServerError/);

const cfForgot = readFileSync("functions/api/auth/forgot-password.ts", "utf8");
const cfReset = readFileSync("functions/api/auth/reset-password.ts", "utf8");
assert.match(cfForgot, /genericAccepted/);
assert.match(cfForgot, /sha256Hex\(token\)/);
assert.match(cfReset, /onRequestPost/);

console.log(
  "✓ Recuperação de senha: produção (Cloudflare) dona do fluxo; Express responde contrato explícito 503, sem token e sem enumeração",
);
