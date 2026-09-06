/**
 * Cripto de PII operacional: rotação possível, falha audível, campo ligado.
 *
 * Os agendamentos e a lista de espera guardam nome, e-mail e telefone de
 * responsáveis — identidade de famílias reais. O esquema que os cifrava tinha
 * três defeitos que só apareceriam no pior dia possível, o dia de responder a
 * um vazamento de chave:
 *
 *   1. o envelope não registrava QUAL chave o cifrou, então trocar
 *      `OPERATIONAL_DATA_KEY` tornava todo registro ilegível, sem volta;
 *   2. `decryptText` devolvia `null` em qualquer falha, então uma rotação
 *      malfeita esvaziaria a agenda EM SILÊNCIO — a tela mostraria campos em
 *      branco, e ninguém saberia que os dados ainda estão lá, ilegíveis;
 *   3. sem AAD, o ciphertext do e-mail decifrava como se fosse o nome.
 *
 * Este teste trava os três. Ele não testa "a cripto funciona" — testa que ela
 * FALHA do jeito certo, que é a parte que ninguém exercita até precisar.
 *
 * Rodar: node --import tsx tests/unit/operational-crypto-rotation.test.ts
 */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  decryptText,
  encryptText,
  OperationalDecryptError,
} from "../../functions/api/operations/_core";

const chaveK1 = randomBytes(32).toString("hex");
const chaveK2 = randomBytes(32).toString("hex");

const comK1 = { OPERATIONAL_DATA_KEY: chaveK1, OPERATIONAL_DATA_KEY_ID: "k1" };
const comK2 = { OPERATIONAL_DATA_KEY: chaveK2, OPERATIONAL_DATA_KEY_ID: "k2" };
const rotacionado = {
  OPERATIONAL_DATA_KEY: chaveK2,
  OPERATIONAL_DATA_KEY_ID: "k2",
  OPERATIONAL_DATA_KEY_PREVIOUS: chaveK1,
  OPERATIONAL_DATA_KEY_PREVIOUS_ID: "k1",
};

const NOME = "Responsável Sintético";

// 1) Ida e volta, e o envelope declara a chave que usou.
{
  const cifrado = await encryptText(comK1, NOME, "guardian_name");
  assert.ok(cifrado?.startsWith("v2.k1."), "o envelope precisa nomear a chave");
  assert.equal(cifrado?.includes(NOME), false, "o nome não pode aparecer no ciphertext");
  assert.equal(await decryptText(comK1, cifrado, "guardian_name"), NOME);
}

// 2) O AAD liga o ciphertext ao CAMPO: o e-mail não pode virar nome.
{
  const email = await encryptText(comK1, "responsavel@exemplo.test", "guardian_email");
  await assert.rejects(
    () => decryptText(comK1, email, "guardian_name"),
    OperationalDecryptError,
    "ciphertext de um campo não pode ser lido como se fosse outro",
  );
  // Limite honesto: o AAD NÃO impede troca entre duas linhas do mesmo campo.
  // Isso exigiria a identidade do registro no AAD, registrado como próximo
  // passo no módulo — este teste não finge que está resolvido.
}

// 3) Rotação: com a chave anterior no keyring, o registro antigo continua legível.
{
  const antigo = await encryptText(comK1, NOME, "guardian_name");
  assert.equal(
    await decryptText(rotacionado, antigo, "guardian_name"),
    NOME,
    "o keyring precisa manter legível o que a chave anterior cifrou",
  );
  const novo = await encryptText(rotacionado, NOME, "guardian_name");
  assert.ok(novo?.startsWith("v2.k2."), "escritas novas usam a chave atual");
}

// 4) O ponto que mais importa: aposentar a chave anterior cedo demais tem que
//    DOER, não emudecer. Este é o caso que devolvia `null` — indistinguível de
//    "esse responsável não tem nome cadastrado".
{
  const antigo = await encryptText(comK1, NOME, "guardian_name");
  await assert.rejects(
    () => decryptText(comK2, antigo, "guardian_name"),
    OperationalDecryptError,
    "chave fora do keyring precisa ser erro explícito, nunca campo vazio",
  );
}

// 5) `null` só significa uma coisa: não havia valor guardado.
{
  assert.equal(await decryptText(comK1, null, "guardian_name"), null);
  assert.equal(await decryptText(comK1, "", "guardian_name"), null);
  assert.equal(await encryptText(comK1, null, "guardian_name"), null);
  await assert.rejects(
    () => decryptText(comK1, "isto-nao-e-um-envelope", "guardian_name"),
    OperationalDecryptError,
    "lixo no campo é erro, não ausência de valor",
  );
}

// 6) Registros legados v1 continuam legíveis pelo keyring, sem AAD.
{
  const { createCipheriv, randomBytes: rb, createHash } = await import("node:crypto");
  const material = createHash("sha256").update(`neuroped-operational-v1:${chaveK1}`).digest();
  const iv = rb(12);
  const cipher = createCipheriv("aes-256-gcm", material, iv);
  const corpo = Buffer.concat([cipher.update(NOME, "utf8"), cipher.final(), cipher.getAuthTag()]);
  const legado = `v1.${iv.toString("base64")}.${corpo.toString("base64")}`;

  assert.equal(
    await decryptText(comK1, legado, "guardian_name"),
    NOME,
    "registro v1 gravado antes desta mudança precisa continuar legível",
  );
  assert.equal(
    await decryptText(rotacionado, legado, "guardian_name"),
    NOME,
    "v1 não diz qual chave usou: o keyring inteiro precisa ser tentado",
  );
  await assert.rejects(
    () => decryptText(comK2, legado, "guardian_name"),
    OperationalDecryptError,
    "v1 ilegível também precisa doer",
  );
}

// 7) Configuração inválida falha fechado, nunca cifra com o que sobrou.
{
  await assert.rejects(
    () => encryptText({}, NOME, "guardian_name"),
    /OPERATIONAL_CRYPTO_NOT_CONFIGURED/,
    "sem chave não se cifra",
  );
  await assert.rejects(
    () => encryptText({ OPERATIONAL_DATA_KEY: "curta-demais" }, NOME, "guardian_name"),
    /OPERATIONAL_CRYPTO_NOT_CONFIGURED/,
    "chave curta é ausência de chave",
  );
  const cifradoK1 = await encryptText(comK1, NOME, "guardian_name");
  await assert.rejects(
    () =>
      decryptText(
        {
          OPERATIONAL_DATA_KEY: chaveK2,
          OPERATIONAL_DATA_KEY_ID: "k1",
          OPERATIONAL_DATA_KEY_PREVIOUS: chaveK1,
          OPERATIONAL_DATA_KEY_PREVIOUS_ID: "k1",
        },
        cifradoK1,
        "guardian_name",
      ),
    /OPERATIONAL_KEY_ID_COLLISION/,
    "dois IDs iguais no keyring tornam o envelope ambíguo: recusar",
  );
}

// 8) Nenhum campo pode ser cifrado sem rótulo — o AAD só protege se todo call
//    site passar o nome do campo, e um call site esquecido é um campo sem
//    proteção. O TypeScript já obriga, mas a trava aqui é contra alguém
//    reintroduzir uma sobrecarga opcional.
{
  const modulo = readFileSync("functions/api/operations/_core.ts", "utf8");
  assert.match(modulo, /field: string,\n\): Promise<string \| null> \{/);
  assert.doesNotMatch(modulo, /field\?: string/, "o rótulo do campo não pode ser opcional");
}

console.log(
  "✅ cripto operacional: chave rotacionável com keyring, envelope declara a chave, AAD liga o ciphertext ao campo, e chave fora do keyring é erro explícito — nunca campo em branco.",
);
