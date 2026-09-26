#!/usr/bin/env node
/**
 * Gera, localmente e uma única vez, os valores do keyring clínico do NeuroPed
 * (CLINICAL_DATA_KEY, CLINICAL_DATA_KEY_ID, CLINICAL_INDEX_KEY) e imprime os
 * comandos para gravá-los como secrets do projeto Cloudflare Pages.
 *
 * Nada é gravado em disco nem enviado a lugar algum: quem executa guarda os
 * valores em cofre de senhas antes de aplicá-los. Regras iguais às de
 * functions/api/tenant/_crypto.ts: cada chave com 32+ caracteres, chave de
 * dados diferente da chave de índice, id com [A-Za-z0-9_-]{1,32}.
 *
 * Uso: node scripts/ops/generate-clinical-keyring.mjs [id-da-chave]
 */
import { randomBytes } from "node:crypto";

const KEY_ID_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;
const keyId = process.argv[2] ?? `k${new Date().toISOString().slice(0, 10).replaceAll("-", "")}`;
if (!KEY_ID_PATTERN.test(keyId)) {
  console.error("Id inválido: use apenas letras, números, _ ou -, até 32 caracteres.");
  process.exit(1);
}
const secret = () => randomBytes(48).toString("base64url");
const dataKey = secret();
let indexKey = secret();
while (indexKey === dataKey) indexKey = secret();

console.log([
  "KEYRING CLÍNICO — gerado agora, mostrado uma única vez. Guarde no cofre de senhas ANTES de aplicar.",
  "",
  `CLINICAL_DATA_KEY_ID=${keyId}`,
  `CLINICAL_DATA_KEY=${dataKey}`,
  `CLINICAL_INDEX_KEY=${indexKey}`,
  "",
  "Aplicar no Cloudflare Pages (token com Cloudflare Pages: Edit; valores lidos do cofre, nunca colados em histórico de shell):",
  `  printf '%s' "$CLINICAL_DATA_KEY_ID" | npx wrangler@4 pages secret put CLINICAL_DATA_KEY_ID --project-name neuroped`,
  `  printf '%s' "$CLINICAL_DATA_KEY"    | npx wrangler@4 pages secret put CLINICAL_DATA_KEY --project-name neuroped`,
  `  printf '%s' "$CLINICAL_INDEX_KEY"   | npx wrangler@4 pages secret put CLINICAL_INDEX_KEY --project-name neuroped`,
  "",
  "Verificar: o próximo deploy (ou GET /api/health) deixa de listar CLINICAL_CRYPTO_NOT_READY.",
  "Rotação futura: mover a chave atual para CLINICAL_DATA_KEY_PREVIOUS[_ID] e gerar uma nova com outro id.",
].join("\n"));
