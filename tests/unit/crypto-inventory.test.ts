/**
 * Contrato do inventário de chaves (GET /api/admin/crypto-inventory).
 *
 * A rota responde uma pergunta cuja resposta errada destrói dado: "já posso
 * aposentar a chave anterior?". Três modos de falha, todos plausíveis:
 *
 * 1. **Ela diz que pode, e não pode.** Um registro esquecido preso à chave
 *    antiga, e a aposentadoria torna um prontuário ilegível para sempre. O
 *    inventário precisa ser conservador em TODOS os casos duvidosos, inclusive
 *    o caso chato: uma tabela que ele não conseguiu ler.
 *
 * 2. **Ela vaza o que inventaria.** Uma rota que lê colunas cifradas e devolve
 *    "só um pedacinho para conferir" é pior que não existir.
 *
 * 3. **Uma tabela cifrada nova não entra na lista.** Ela fica invisível para a
 *    decisão, e o inventário passa a afirmar segurança que não verificou.
 *
 * Roda o handler REAL contra o schema REAL, com envelopes construídos à mão
 * nos formatos exatos que os dois keyrings produzem.
 *
 * Nenhum dado de paciente real: todo conteúdo aqui é sintético.
 *
 * Rodar: node --import tsx tests/unit/crypto-inventory.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { randomBytes } from "node:crypto";

import { onRequestGet } from "../../functions/api/admin/crypto-inventory";

// ── Banco: bootstrap real, mesma política travada em schema-bootstrap-contract
const raw = new DatabaseSync(":memory:");
raw.exec("PRAGMA foreign_keys = OFF;");
raw.exec(readFileSync("db/schema.d1.sql", "utf8"));
for (const nome of readdirSync("db/migrations").filter((f) => f.endsWith(".sql")).sort()) {
  try {
    raw.exec(readFileSync(`db/migrations/${nome}`, "utf8"));
  } catch (erro) {
    assert.match(String(erro), /duplicate column name/i, `migração ${nome}: ${String(erro)}`);
  }
}

function makeDb(database: DatabaseSync): D1Database {
  const prepare = (sql: string) => {
    const make = (args: unknown[]) => ({
      async first<T>() {
        return (database.prepare(sql).get(...(args as never[])) as T | undefined) ?? null;
      },
      async run() {
        const info = database.prepare(sql).run(...(args as never[]));
        return { meta: { changes: Number(info.changes) } };
      },
      async all<T>() {
        return { results: database.prepare(sql).all(...(args as never[])) as T[] };
      },
    });
    return { bind: (...args: unknown[]) => make(args), ...make([]) };
  };
  return { prepare } as unknown as D1Database;
}
const db = makeDb(raw);

const CHAVE = randomBytes(32).toString("hex");
const AMBIENTE = {
  DB: db,
  CLINICAL_DATA_KEY: CHAVE,
  CLINICAL_DATA_KEY_ID: "k2",
  OPERATIONAL_DATA_KEY: CHAVE,
  OPERATIONAL_DATA_KEY_ID: "k2",
};

const ADMIN = { id: "u-admin", name: "Admin", email: "admin@x.invalid", role: "admin" };
const PROFISSIONAL = { ...ADMIN, id: "u-pro", role: "professional" };

function chamar(env: Record<string, unknown>, authUser: unknown) {
  return onRequestGet({
    env,
    data: { authUser },
    request: new Request("https://x.invalid/api/admin/crypto-inventory"),
  } as never);
}

interface Resumo {
  chaveAtual: string;
  chaveAnteriorConfigurada: boolean;
  registrosPorChave: Record<string, number>;
  registrosSemMarcacaoDeChave: number;
  tabelasNaoInspecionadas: number;
  podeAposentarChaveAnterior: boolean;
  motivos: string[];
}

async function inventario(env: Record<string, unknown> = AMBIENTE) {
  const resposta = await chamar(env, ADMIN);
  assert.equal(resposta.status, 200);
  return (await resposta.json()) as { clinico: Resumo; operacional: Resumo; nota: string };
}

// ── Envelopes sintéticos, nos formatos exatos dos dois keyrings ─────────────
// O corpo é ruído: o inventário lê PREFIXO, nunca decifra. Se algum dia ele
// tentar decifrar, estes registros o farão falhar — que é o comportamento
// desejado, porque decifrar não é o trabalho desta rota.
const corpo = () => `${randomBytes(12).toString("base64")}.${randomBytes(32).toString("base64")}`;
const clinico = (chave: string) => `v1.${chave}.${corpo()}`;
const operacionalV2 = (chave: string) => `v2.${chave}.${corpo()}`;
const operacionalLegado = () => `v1.${corpo()}`;

// 1) Sem sessão e sem admin, a rota não conta nada sobre a instalação.
{
  assert.equal((await chamar(AMBIENTE, null)).status, 401);
  assert.equal((await chamar(AMBIENTE, PROFISSIONAL)).status, 403);
  // A negativa não pode vazar o inventário por dentro da mensagem.
  const corpoNegado = await (await chamar(AMBIENTE, PROFISSIONAL)).text();
  assert.doesNotMatch(corpoNegado, /registrosPorChave|podeAposentar|k1|k2/);
}

// 2) Banco vazio: nada preso a chave nenhuma, então pode aposentar.
{
  const { clinico: c, operacional: o } = await inventario();
  assert.deepEqual(c.registrosPorChave, {});
  assert.equal(c.podeAposentarChaveAnterior, true, "banco vazio não prende chave nenhuma");
  assert.deepEqual(c.motivos, []);
  assert.equal(o.podeAposentarChaveAnterior, true);
}

// ── Semear registros sintéticos ────────────────────────────────────────────
raw.exec(`
  INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at)
  VALUES ('u-admin', 'Admin', 'admin@x.invalid', 'nao-e-hash-real', 'admin', 1,
          datetime('now'), datetime('now'));
  INSERT INTO clinics (id, name, slug, created_by_user_id, created_at, updated_at)
  VALUES ('cl-inv', 'Clinica Inventario', 'clinica-inventario', 'u-admin',
          datetime('now'), datetime('now'));
`);

const inserirPaciente = (id: string, envelope: string) =>
  raw
    .prepare(
      `INSERT INTO live_patients (id, clinic_id, created_by_user_id, profile_encrypted,
                                  patient_identity_hash, encryption_version, status,
                                  created_at, updated_at)
       VALUES (?, 'cl-inv', 'u-admin', ?, ?, 'clinical-v1', 'active',
               datetime('now'), datetime('now'))`,
    )
    .run(id, envelope, randomBytes(16).toString("hex"));

// 3) Registro na chave ATUAL não impede aposentar a anterior.
{
  inserirPaciente("p-atual", clinico("k2"));
  const { clinico: c } = await inventario();
  assert.deepEqual(c.registrosPorChave, { k2: 1 });
  assert.equal(c.podeAposentarChaveAnterior, true, "registro na chave atual não prende a anterior");
}

// 4) O caso que importa: um único registro na chave ANTERIOR trava tudo.
{
  inserirPaciente("p-antigo", clinico("k1"));
  const { clinico: c } = await inventario();
  assert.deepEqual(c.registrosPorChave, { k1: 1, k2: 1 });
  assert.equal(
    c.podeAposentarChaveAnterior,
    false,
    "UM registro preso à chave anterior já basta: aposentá-la o tornaria ilegível",
  );
  assert.deepEqual(c.motivos, ["REGISTROS_EM_CHAVE_ANTERIOR"]);
}

// 5) Envelope operacional LEGADO não diz qual chave usou — e "não sei" nunca
//    pode virar "pode aposentar".
{
  raw
    .prepare(
      `INSERT INTO notification_outbox (id, appointment_id, provider_user_id, channel, template,
                                        recipient_encrypted, payload_encrypted, status,
                                        created_at, updated_at)
       VALUES ('n-legado', NULL, 'u-admin', 'email', 'lembrete', ?, ?, 'pending_provider',
               datetime('now'), datetime('now'))`,
    )
    .run(operacionalLegado(), operacionalV2("k2"));

  const { operacional: o } = await inventario();
  assert.equal(o.registrosPorChave.k2, 1, "o v2 é contabilizado pela chave que declara");
  assert.equal(o.registrosSemMarcacaoDeChave, 1, "o v1 legado entra no balde de não marcados");
  assert.equal(
    o.podeAposentarChaveAnterior,
    false,
    "registro sem marcação de chave impede aposentadoria: não há como provar que sobrevive",
  );
  assert.ok(o.motivos.includes("REGISTROS_SEM_MARCACAO_DE_CHAVE"));

  // E o IV do envelope legado — segundo segmento do v1 — NÃO pode virar rótulo
  // de chave na resposta. Publicá-lo seria vazar estrutura do envelope sem
  // nenhuma razão.
  const rotulos = Object.keys(o.registrosPorChave);
  assert.deepEqual(rotulos, ["k2"], "o IV do envelope legado não pode ser publicado como chave");
}

// 6) Nada de ciphertext, id de registro ou segredo na resposta.
{
  const envelopeSondado = clinico("k9");
  inserirPaciente("p-sonda", envelopeSondado);
  const resposta = await chamar(AMBIENTE, ADMIN);
  const texto = await resposta.text();

  assert.equal(texto.includes(CHAVE), false, "o valor da chave não pode sair");
  assert.equal(texto.includes(CHAVE.slice(0, 8)), false, "nem o prefixo do valor da chave");
  assert.equal(texto.includes(envelopeSondado), false, "o envelope não pode sair");
  // Corpo do envelope: nem inteiro, nem em pedaço reconhecível.
  const corpoDoEnvelope = envelopeSondado.split(".").slice(2).join(".");
  assert.equal(texto.includes(corpoDoEnvelope), false, "nem o corpo do envelope");
  assert.equal(texto.includes("p-sonda"), false, "id de registro não pode sair");
  assert.equal(texto.includes("cl-inv"), false, "id de clínica não pode sair");
  // O rótulo público da chave PODE sair — é o que torna o inventário útil.
  assert.match(texto, /"k9":\s*1/, "o identificador público de chave é o produto desta rota");

  // A resposta inteira precisa ser só número, booleano e rótulo curto de
  // chave. Qualquer string longa é suspeita de ser envelope, id ou segredo
  // que escapou — inclusive uma que este teste não soube prever.
  const longas = [...texto.matchAll(/"([^"]{40,})"/g)]
    .map((m) => m[1])
    .filter((valor) => !valor.startsWith("Somente contagens"));
  assert.deepEqual(longas, [], `string longa na resposta do inventário: ${longas.join(" | ")}`);
}

// 6-bis) O caso chato, e o mais fácil de deixar passar: uma tabela que o
//        inventário NÃO conseguiu ler. Ele não sabe o que há nela — e "não
//        sei" não pode virar "pode aposentar".
//
//        Precisa de um banco LIMPO. No banco acima já existem registros presos
//        à chave anterior, então eles bloqueariam a aposentadoria sozinhos e a
//        condição `ilegiveis` passaria despercebida — foi exatamente assim que
//        a primeira versão deste teste deixou o defeito escapar. Aqui a tabela
//        ausente é o ÚNICO motivo possível.
{
  const limpo = new DatabaseSync(":memory:");
  limpo.exec("PRAGMA foreign_keys = OFF;");
  limpo.exec(readFileSync("db/schema.d1.sql", "utf8"));
  for (const nome of readdirSync("db/migrations").filter((f) => f.endsWith(".sql")).sort()) {
    try {
      limpo.exec(readFileSync(`db/migrations/${nome}`, "utf8"));
    } catch (erro) {
      assert.match(String(erro), /duplicate column name/i);
    }
  }
  limpo.exec("DROP TABLE live_assessment_responses;");

  const { clinico: c } = await inventario({ ...AMBIENTE, DB: makeDb(limpo) });
  assert.deepEqual(c.registrosPorChave, {}, "banco limpo: nenhum registro em chave nenhuma");
  assert.equal(c.registrosSemMarcacaoDeChave, 0, "banco limpo: nada sem marcação");
  assert.equal(c.tabelasNaoInspecionadas, 1, "exatamente a tabela derrubada");
  assert.deepEqual(
    c.motivos,
    ["TABELA_NAO_INSPECIONADA"],
    "a tabela ausente precisa ser o único motivo — é o que isola esta proteção",
  );
  assert.equal(
    c.podeAposentarChaveAnterior,
    false,
    "tabela que não pôde ser lida bloqueia a aposentadoria: ausência de prova é prova de risco",
  );
}

// 7) Toda tabela com coluna cifrada precisa estar inventariada. Uma tabela
//    nova fora da lista some da decisão de aposentar chave — e o inventário
//    passaria a afirmar segurança que não verificou.
{
  const migracoes = readdirSync("db/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(`db/migrations/${f}`, "utf8"))
    .join("\n");

  const cifradas = new Set<string>();
  for (const bloco of migracoes.matchAll(/CREATE TABLE IF NOT EXISTS (\w+) \(([\s\S]*?)\n\);/g)) {
    const [, tabela, corpoDdl] = bloco;
    for (const linha of corpoDdl.split("\n")) {
      const semComentario = linha.split("--")[0];
      const coluna = semComentario.match(/^\s*(\w*_encrypted)\b/);
      if (coluna) cifradas.add(`${tabela}.${coluna[1]}`);
    }
  }

  const fonte = readFileSync("functions/api/admin/crypto-inventory.ts", "utf8");
  const inventariadas = new Set(
    [...fonte.matchAll(/\{ tabela: "(\w+)", coluna: "(\w+)" \}/g)].map((m) => `${m[1]}.${m[2]}`),
  );

  const faltando = [...cifradas].filter((alvo) => !inventariadas.has(alvo)).sort();
  assert.deepEqual(
    faltando,
    [],
    `coluna cifrada fora do inventário: ${faltando.join(", ")} — ` +
      "uma coluna não inventariada some da decisão de aposentar chave",
  );
  assert.ok(cifradas.size >= 12, `esperava >=12 colunas cifradas, encontrei ${cifradas.size}`);
}

console.log(
  `✅ inventário de chaves: ${"conservador em todo caso duvidoso"} — registro na chave anterior, ` +
    "registro sem marcação e tabela não inspecionada bloqueiam a aposentadoria; nenhum ciphertext, " +
    "id ou segredo sai na resposta; e toda coluna cifrada do schema está coberta.",
);
