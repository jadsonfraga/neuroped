// G4 — backup/restore com ciphertext real, ensaiado localmente com o mesmo
// script que o workflow `dr-mechanism-rehearsal.yml` usa no D1 temporário.
// Chave efêmera gerada aqui; conteúdo 100% sintético. Nada de produção.
import assert from "node:assert/strict";
import { readFileSync, readdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import Database from "better-sqlite3";

const read = (p) => readFileSync(p, "utf8");
const script = "scripts/dr/real-ciphertext.mts";
const work = mkdtempSync(join(tmpdir(), "dr-real-"));
const manifest = join(work, "manifest.json");
const key = randomBytes(32).toString("base64");
const baseEnv = { ...process.env };
for (const name of ["CLINICAL_DATA_KEY", "CLINICAL_DATA_KEY_PREVIOUS", "CLINICAL_INDEX_KEY", "DR_REHEARSAL_DATA_KEY"]) delete baseEnv[name];
const run = (args, { env = {}, input } = {}) =>
  spawnSync(process.execPath, [script, ...args], { encoding: "utf8", input, env: { ...baseEnv, ...env } });

try {
  // Guardas: sem chave efêmera, ou com keyring de produção no ambiente → recusa.
  assert.notEqual(run(["fixture", manifest]).status, 0, "sem chave efêmera o ensaio recusa");
  const withProd = run(["fixture", manifest], { env: { DR_REHEARSAL_DATA_KEY: key, CLINICAL_DATA_KEY: "p".repeat(40) } });
  assert.notEqual(withProd.status, 0);
  assert.match(withProd.stderr, /CLINICAL_DATA_KEY presente/);

  // Origem: schema real + migrações + fixtures sintéticos + linhas com cifra real.
  const source = new Database(":memory:");
  source.pragma("foreign_keys = OFF");
  source.exec(read("db/schema.d1.sql"));
  for (const name of readdirSync("db/migrations").filter((n) => n.endsWith(".sql")).sort()) {
    try { source.exec(read(`db/migrations/${name}`)); } catch (error) {
      assert.match(error.message, /duplicate column name/i, `${name}: ${error.message}`);
    }
  }
  source.pragma("foreign_keys = ON");
  source.exec(read("scripts/dr/synthetic-fixture.sql"));
  const fixture = run(["fixture", manifest], { env: { DR_REHEARSAL_DATA_KEY: key } });
  assert.equal(fixture.status, 0, fixture.stderr);
  assert.doesNotMatch(fixture.stdout, /Paciente Sintético|observação sintética|gatilhos/, "o SQL só leva ciphertext");
  source.exec(fixture.stdout);
  const entries = JSON.parse(read(manifest));
  assert.equal(entries.length, 10);
  assert.ok(entries.every((e) => /^[0-9a-f]{64}$/.test(e.plainSha256) && !("plain" in e)), "manifesto só com hashes");

  // Backup em SQL (como o `d1 export`) e restauração em banco distinto.
  const dump = [];
  for (const { name, sql } of source.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid").all()) {
    dump.push(`${sql};`);
    const cols = source.prepare(`PRAGMA table_info("${name}")`).all().map((c) => `quote("${c.name}")`).join(" || ',' || ");
    for (const row of source.prepare(`SELECT ${cols} AS v FROM "${name}"`).all()) dump.push(`INSERT INTO "${name}" VALUES (${row.v});`);
  }
  for (const { sql } of source.prepare("SELECT sql FROM sqlite_master WHERE type IN ('index','trigger') AND sql IS NOT NULL ORDER BY rowid").all()) dump.push(`${sql};`);
  const restored = new Database(":memory:");
  restored.pragma("foreign_keys = OFF");
  restored.exec(dump.join("\n"));
  restored.pragma("foreign_keys = ON");
  assert.deepEqual(restored.prepare("PRAGMA foreign_key_check").all(), []);

  const readback = run(["readback-sql"]).stdout;
  const asWrangler = (db) => JSON.stringify([{ results: db.prepare(readback).all(), success: true }]);
  assert.equal(asWrangler(restored), asWrangler(source), "ciphertext idêntico byte a byte após restauração");

  const ok = run(["verify", manifest], { env: { DR_REHEARSAL_DATA_KEY: key }, input: `wrangler noise\n${asWrangler(restored)}` });
  assert.equal(ok.status, 0, ok.stderr);
  assert.equal(ok.stdout.trim(), "decifrados=10 recusas_de_contexto_errado=30");

  // Outra chave não decifra o backup.
  const wrongKey = run(["verify", manifest], { env: { DR_REHEARSAL_DATA_KEY: randomBytes(32).toString("base64") }, input: asWrangler(restored) });
  assert.notEqual(wrongKey.status, 0);

  // Um byte adulterado ou uma linha perdida falham o ensaio.
  const target = entries.find((e) => e.table === "live_patients");
  const tampered = new Database(":memory:");
  tampered.exec(dump.join("\n"));
  tampered.prepare("UPDATE live_patients SET profile_encrypted = substr(profile_encrypted, 1, length(profile_encrypted) - 4) || 'AAA=' WHERE id = ?").run(target.id);
  assert.notEqual(run(["verify", manifest], { env: { DR_REHEARSAL_DATA_KEY: key }, input: asWrangler(tampered) }).status, 0);
  tampered.exec("PRAGMA foreign_keys = OFF; DELETE FROM live_diary_entries WHERE id LIKE 'dr-rehearsal-real-diary-beta-2';");
  const missing = run(["verify", manifest], { env: { DR_REHEARSAL_DATA_KEY: key }, input: asWrangler(tampered) });
  assert.notEqual(missing.status, 0);

  // O dano destrutivo do ensaio (Etapa F) não toca as linhas de cifra real.
  restored.prepare("DELETE FROM live_patients WHERE id = 'dr-rehearsal-patient-alpha'").run();
  assert.equal(run(["verify", manifest], { env: { DR_REHEARSAL_DATA_KEY: key }, input: asWrangler(restored) }).status, 0);

  // Workflow: chave efêmera mascarada, verificação após import e após Time Travel, limpeza.
  const workflow = read(".github/workflows/dr-mechanism-rehearsal.yml");
  assert.match(workflow, /openssl rand -base64 48/);
  assert.match(workflow, /::add-mask::/);
  assert.doesNotMatch(workflow, /secrets\.CLINICAL_/, "o ensaio nunca usa o keyring de produção");
  assert.equal((workflow.match(/real-ciphertext\.mts verify/g) ?? []).length, 2, "verifica após import e após Time Travel");
  assert.match(workflow, /dr-real-tt\.txt "\$DR_MANIFEST"/, "a limpeza incondicional apaga o manifesto");
  writeFileSync(join(work, ".done"), "");
  console.log("✓ G4 local: cifra real sobrevive a backup/restore; outra chave, clínica, finalidade, adulteração e perda falham");
} finally {
  rmSync(work, { recursive: true, force: true });
}
