// 0029 reexecutável em produção.
// Regressão (29/09): o workflow aplicava o arquivo inteiro de novo e o D1 de
// produção, que já tinha clinic_id desde 26/09, falhava com
// "duplicate column name: clinic_id". Agora o workflow garante cada coluna via
// pragma_table_info e aplica só o trecho a partir do marcador de backfill.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

const MIGRATION = "db/migrations/0029_operations_clinic_scope.sql";
const WORKFLOW = ".github/workflows/operations-clinic-scope-d1-migration.yml";
const sql = readFileSync(MIGRATION, "utf8");
const workflow = readFileSync(WORKFLOW, "utf8");

// --- Contrato workflow × arquivo ---
const markerMatch = workflow.match(/awk 'BEGIN \{emit=0\} \/\^([^/]+)\/ \{emit=1\} emit \{print\}'/);
assert.ok(markerMatch, "workflow deve extrair o trecho pós-ALTER da 0029 por marcador");
const marker = markerMatch[1];
const markerLines = sql.split("\n").filter((line) => line.startsWith(marker));
assert.equal(markerLines.length, 1, `marcador "${marker}" deve aparecer uma única vez na 0029`);
const postAlter = sql.slice(sql.indexOf(`\n${marker}`) + 1);
assert.doesNotMatch(postAlter, /ALTER\s+TABLE/i, "trecho pós-marcador não pode conter ALTER TABLE");
assert.doesNotMatch(workflow, /--file=\.\/db\/migrations\/0029_operations_clinic_scope\.sql/, "arquivo inteiro não pode ser reaplicado em produção");

const alters = [...sql.matchAll(/^ALTER TABLE (\w+) ADD COLUMN (\w+) ([^;]+);$/gm)].map((m) => [m[1], m[2], m[3].trim()]);
assert.equal(alters.length, 8);
for (const [table, column, definition] of alters) {
  assert.match(workflow, new RegExp(`add_column ${table} ${column} "${definition}"`), `workflow deve garantir ${table}.${column}`);
}
assert.match(workflow, /pragma_table_info\('\$table'\) WHERE name='\$column'/);
for (const statement of postAlter.replace(/--.*$/gm, "").split(";").map((s) => s.trim()).filter(Boolean)) {
  if (/^UPDATE/i.test(statement)) assert.match(statement, /WHERE clinic_id IS NULL$/i, `backfill sem guarda: ${statement.slice(0, 60)}`);
  else assert.match(statement, /^CREATE INDEX IF NOT EXISTS/i, `comando não idempotente: ${statement.slice(0, 60)}`);
}

// --- Execução real em SQLite ---
const migrations = readdirSync("db/migrations").filter((f) => f.endsWith(".sql")).sort();
function build(upTo) {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = OFF;");
  db.exec(readFileSync("db/schema.d1.sql", "utf8"));
  for (const name of migrations.filter((f) => f < upTo)) {
    try { db.exec(readFileSync(`db/migrations/${name}`, "utf8")); } catch (error) {
      assert.match(String(error), /duplicate column name/i, `${name}: ${String(error)}`);
    }
  }
  return db;
}
const snapshot = (db) => alters.map(([table]) => ({
  table,
  columns: db.prepare(`SELECT name, type, "notnull", dflt_value FROM pragma_table_info('${table}') ORDER BY cid`).all().map((r) => ({ ...r })),
  indexes: db.prepare(`SELECT name FROM sqlite_master WHERE type='index' AND tbl_name=? AND name LIKE '%clinic%' ORDER BY name`).all(table).map((r) => r.name),
}));

// Banco novo: arquivo inteiro, como sempre.
const fresh = build("0029");
fresh.exec(sql);
const freshSchema = snapshot(fresh);

// Produção: colunas já existem (26/09). O arquivo inteiro falha — o bug.
const prod = build("0029");
prod.exec(sql);
assert.throws(() => prod.exec(sql), /duplicate column name: clinic_id/);

// Caminho do workflow, duas vezes: add_column condicional + trecho pós-ALTER.
function applyLikeWorkflow(db) {
  for (const [table, column, definition] of alters) {
    const exists = db.prepare(`SELECT name FROM pragma_table_info('${table}') WHERE name=?`).get(column);
    if (!exists) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
  }
  db.exec(postAlter);
}
applyLikeWorkflow(prod);
applyLikeWorkflow(prod);
assert.deepEqual(snapshot(prod), freshSchema, "produção reexecutada termina com o mesmo schema do banco novo");

// Banco sem as colunas (antes de 0029) pelo caminho do workflow = schema do banco novo.
const pre = build("0029");
applyLikeWorkflow(pre);
assert.deepEqual(snapshot(pre), freshSchema);

// Backfill: só preenche o caso não ambíguo e não sobrescreve atribuição manual.
pre.exec(`
  INSERT INTO clinic_memberships (clinic_id, user_id, role, active) VALUES ('c1','u-one','owner',1), ('c1','u-two','owner',1), ('c2','u-two','professional',1);
`);
const insert = pre.prepare("INSERT INTO booking_services (id, provider_user_id, name, duration_minutes, clinic_id) VALUES (?, ?, 'Consulta', 30, ?)");
const insertService = (id, provider, clinicId = null) => insert.run(id, provider, clinicId);
insertService("s-one", "u-one");
insertService("s-two", "u-two");
insertService("s-manual", "u-two", "c2");
applyLikeWorkflow(pre);
applyLikeWorkflow(pre);
const got = Object.fromEntries(pre.prepare("SELECT id, clinic_id FROM booking_services ORDER BY id").all().map((r) => [r.id, r.clinic_id]));
assert.deepEqual(got, { "s-manual": "c2", "s-one": "c1", "s-two": null });

// Regressão (30/09): a contagem de clinic_id NULL ia só para o resumo do job,
// ilegível pela API/CLI. Precisa sair também no log e como anotação.
assert.match(workflow, /echo "sem clinic_id: \$table = \$count"/, "contagem por tabela no log");
assert.match(workflow, /::warning::\$total linha\(s\) da agenda sem clinic_id/, "total pendente como anotação");
assert.doesNotMatch(workflow, /WHERE clinic_id IS NULL;" \\\n\s*>> "\$GITHUB_STEP_SUMMARY"/, "contagem não pode ir só para o resumo");

console.log("✓ 0029 reexecutável: colunas por pragma_table_info, backfill guardado, índices IF NOT EXISTS, schema igual ao banco novo");
