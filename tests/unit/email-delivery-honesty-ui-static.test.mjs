// A UI não pode afirmar entrega de e-mail que o servidor não atestou.
// Contratos estáticos dos três pontos: cadastro, reenvio e conta criada sem sessão.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const cadastro = readFileSync("client/src/pages/cadastro.tsx", "utf8");
const verificar = readFileSync("client/src/pages/verificar-email.tsx", "utf8");
const verificacaoClient = readFileSync("client/src/lib/emailVerificationClient.ts", "utf8");
const auth = readFileSync("client/src/contexts/AuthContext.tsx", "utf8");

// Cadastro: conta criada com link não enviado vira aviso, não navegação silenciosa.
assert.match(auth, /emailVerificationDelivery === "sent" \? "sent" : "failed"/, "AuthContext falha fechado quando o campo está ausente");
assert.match(cadastro, /result\.emailVerificationDelivery === "failed"/, "cadastro lê o resultado da entrega");
assert.match(cadastro, /data-testid="signup-email-delivery-failed"/, "aviso explícito de e-mail não enviado");
assert.match(cadastro, /AUTH_SESSION_UNAVAILABLE/, "conta criada sem sessão tem mensagem própria");
assert.match(cadastro, /Não crie a conta de novo/, "a mensagem impede recadastro (EMAIL_IN_USE)");
assert.match(cadastro, /delivery === "failed"/, "falha de sessão preserva falha de entrega na UI");
assert.doesNotMatch(cadastro, /pelo link que enviamos/, "não promete link não enviado na falha de sessão");

// Reenvio: sucesso genérico só quando o servidor aceitou (202); falha real não vira "o link chegará".
assert.match(verificacaoClient, /class EmailVerificationBlockedError/, "503 BLOCKED_EXTERNAL é tipado");
assert.doesNotMatch(verificar, /finally \{[^}]*setResent\(true\)/s, "setResent(true) não pode rodar no finally");
assert.match(verificar, /data-testid="verify-email-resend-error"/, "erro de reenvio é exibido");
assert.match(verificar, /EmailVerificationBlockedError/, "estado bloqueado tem mensagem própria");
assert.doesNotMatch(verificar, /chegará em instantes/, "202 não comprova envio nem entrega");
assert.match(verificar, /A entrega não foi confirmada/, "202 declara apenas recebimento da solicitação");
const recuperacao = readFileSync("client/src/pages/esqueci-senha.tsx", "utf8");
assert.doesNotMatch(recuperacao, /chegarão em instantes/, "recuperação 202 também não comprova entrega");
assert.match(recuperacao, /entrega ainda não foi confirmada/, "recuperação 202 explica incerteza");

console.log("✓ email-delivery-honesty-ui: cadastro, reenvio e conta sem sessão não afirmam entrega não atestada");
