/**
 * Diários de acompanhamento no Clinical LIVE (migration 0039), com os handlers
 * REAIS, middleware global e todas as migrations em SQLite (node:sqlite).
 * Dados 100% fictícios: nenhum paciente real, nenhum relato real.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fixture, ALFA, BETA } from "./_multiclinic-fixture";
import {
  onRequestGet as diaryGet,
  onRequestPost as diaryPost,
  onRequestPatch as diaryPatch,
} from "../../functions/api/live/diaries/index";
import { collectTenantExportPayload } from "../../functions/api/tenant/_exportPayload";
import { encryptClinicalJson } from "../../functions/api/tenant/_crypto";
import { isValidDiaryDate, validateLiveDiaryEntry } from "../../shared/live-diaries";
import { liveDiaryEntriesFromResponse, liveDiaryWriteBody } from "../../client/src/lib/liveDiaryClient";

const PATH = "/api/live/diaries";

/** O fixture grava perfis que não são ciphertext; o export exige decifra válida. */
async function prepareExport(f: Awaited<ReturnType<typeof fixture>>, clinicId: string) {
  const rows = f.raw.prepare("SELECT id, clinic_id FROM live_patients").all() as Array<{ id: string; clinic_id: string }>;
  for (const row of rows) {
    const profile = await encryptClinicalJson(f.env as never, row.clinic_id, `patient-profile:${row.id}`, { name: "Paciente fictício" });
    f.raw.prepare("UPDATE live_patients SET profile_encrypted = ? WHERE id = ?").run(profile, row.id);
  }
  f.raw.prepare("INSERT OR IGNORE INTO tenant_lifecycle (clinic_id, status) VALUES (?, 'active')").run(clinicId);
}
const entry = (over: Record<string, unknown> = {}) => ({
  clinicId: ALFA,
  patientId: "paciente-alfa",
  diaryId: "diario-sono",
  entryDate: "2026-11-01",
  reportedBy: "family",
  fields: { bedtime: "21:30", wakeups: "2", quality: "4", notes: "Relato fictício de sono agitado" },
  ...over,
});
type Listed = { data: Array<{ id: string; status: string; fields: Record<string, string>; authorUserId: string; diaryId: string }> };

test("diários LIVE: escrita por papel, isolamento entre clínicas e cifra em repouso", async () => {
  const f = await fixture();
  try {
    const created = await f.call("prof-a", diaryPost as never, PATH, "POST", entry(), ALFA);
    assert.equal(created.status, 201);
    const rec = (await created.json()) as { id: string; authorUserId: string; fields: Record<string, string>; status: string };
    assert.equal(rec.authorUserId, "prof-a", "o autor vem da sessão, não do corpo");
    assert.equal(rec.fields.notes, "Relato fictício de sono agitado");
    assert.equal(rec.status, "active");

    // cifra em repouso: o texto relatado não aparece no banco
    const stored = f.raw.prepare("SELECT payload_encrypted FROM live_diary_entries WHERE id = ?").get(rec.id) as { payload_encrypted: string };
    assert.doesNotMatch(stored.payload_encrypted, /Relato fictício|21:30/);

    // secretaria e financeiro não leem nem escrevem conteúdo clínico
    for (const user of ["sec-a", "fin-a"]) {
      assert.equal((await f.call(user, diaryPost as never, PATH, "POST", entry(), ALFA)).status, 403, user);
      assert.equal((await f.call(user, diaryGet as never, `${PATH}?clinicId=${ALFA}&patientId=paciente-alfa`, "GET", undefined, ALFA)).status, 403, user);
    }

    // BETA não enxerga nem altera a ALFA; paciente de outra clínica é recusado
    assert.equal((await f.call("prof-b", diaryGet as never, `${PATH}?clinicId=${ALFA}&patientId=paciente-alfa`, "GET", undefined, ALFA)).status, 403);
    assert.equal((await f.call("prof-b", diaryGet as never, `${PATH}?clinicId=${ALFA}&patientId=paciente-alfa`, "GET", undefined, BETA)).status, 403, "X-Tenant-Id forjado não abre a ALFA");
    assert.equal((await f.call("prof-a", diaryPost as never, PATH, "POST", entry({ patientId: "paciente-beta" }), ALFA)).status, 404);
    assert.equal((await f.call("prof-b", diaryPatch as never, PATH, "PATCH", { clinicId: BETA, id: rec.id, action: "void" }, BETA)).status, 404, "registro da ALFA responde como inexistente para a BETA");
    assert.equal((await f.call("prof-b", diaryGet as never, `${PATH}?clinicId=${BETA}&patientId=paciente-alfa`, "GET", undefined, BETA)).status, 404);

    const list = (await (await f.call("prof-a", diaryGet as never, `${PATH}?clinicId=${ALFA}&patientId=paciente-alfa&diaryId=diario-sono`, "GET", undefined, ALFA)).json()) as Listed;
    assert.equal(list.data.length, 1);
    assert.equal(list.data[0].fields.quality, "4");

    // auditoria metadata-only
    const audits = f.raw.prepare("SELECT metadata_json FROM saas_audit_log WHERE action LIKE 'live_diary_entry_%'").all() as Array<{ metadata_json: string }>;
    assert.ok(audits.length >= 1);
    for (const audit of audits) assert.doesNotMatch(audit.metadata_json, /Relato|paciente-|21:30|2026-11-01/);
  } finally {
    f.raw.close();
  }
});

test("diários LIVE: validação, correção por sucessão, anulação e gatilhos do banco", async () => {
  const f = await fixture();
  try {
    const post = (body: unknown) => f.call("prof-a", diaryPost as never, PATH, "POST", body, ALFA);
    assert.equal((await post(entry({ diaryId: "diario-inexistente" }))).status, 400);
    assert.equal((await post(entry({ entryDate: "2026-02-31" }))).status, 400);
    assert.equal((await post(entry({ entryDate: "2999-01-01" }))).status, 400);
    assert.equal((await post(entry({ fields: {} }))).status, 400);
    assert.equal((await post(entry({ fields: { "Campo Inválido": "x" } }))).status, 400);
    assert.equal((await post(entry({ reportedBy: "ia" }))).status, 400);
    assert.equal((await post(entry({ fields: { notes: "x".repeat(2_001) } }))).status, 400);

    const first = (await (await post(entry())).json()) as { id: string };
    const fixed = await post(entry({ supersedesEntryId: first.id, fields: { quality: "3", notes: "Correção fictícia" } }));
    assert.equal(fixed.status, 201);
    const second = (await fixed.json()) as { id: string; fields: Record<string, string> };
    assert.equal(second.fields.quality, "3");
    assert.equal((f.raw.prepare("SELECT status FROM live_diary_entries WHERE id = ?").get(first.id) as { status: string }).status, "corrected");

    // corrigir de novo a mesma linha antiga, ou atravessar diário, falha sem efeito parcial
    const before = (f.raw.prepare("SELECT COUNT(*) AS n FROM live_diary_entries").get() as { n: number }).n;
    assert.equal((await post(entry({ supersedesEntryId: first.id }))).status, 409);
    assert.equal((await post(entry({ diaryId: "diario-alimentar", supersedesEntryId: second.id }))).status, 409);
    assert.equal((f.raw.prepare("SELECT COUNT(*) AS n FROM live_diary_entries").get() as { n: number }).n, before);

    const active = (await (await f.call("prof-a", diaryGet as never, `${PATH}?clinicId=${ALFA}&patientId=paciente-alfa`, "GET", undefined, ALFA)).json()) as Listed;
    assert.deepEqual(active.data.map((row) => row.id), [second.id]);
    const history = (await (await f.call("prof-a", diaryGet as never, `${PATH}?clinicId=${ALFA}&patientId=paciente-alfa&history=1`, "GET", undefined, ALFA)).json()) as Listed;
    assert.equal(history.data.length, 2, "histórico preserva a versão corrigida");

    // anulação: só profissional, uma vez, registro some da lista ativa mas fica no histórico
    assert.equal((await f.call("sec-a", diaryPatch as never, PATH, "PATCH", { clinicId: ALFA, id: second.id, action: "void" }, ALFA)).status, 403);
    assert.equal((await f.call("prof-a", diaryPatch as never, PATH, "PATCH", { clinicId: ALFA, id: second.id, action: "delete" }, ALFA)).status, 400);
    assert.equal((await f.call("prof-a", diaryPatch as never, PATH, "PATCH", { clinicId: ALFA, id: second.id, action: "void" }, ALFA)).status, 200);
    assert.equal((await f.call("prof-a", diaryPatch as never, PATH, "PATCH", { clinicId: ALFA, id: second.id, action: "void" }, ALFA)).status, 409);
    const afterVoid = (await (await f.call("prof-a", diaryGet as never, `${PATH}?clinicId=${ALFA}&patientId=paciente-alfa`, "GET", undefined, ALFA)).json()) as Listed;
    assert.equal(afterVoid.data.length, 0);

    // gatilhos: conteúdo imutável, status não volta, tenant do paciente no banco
    assert.throws(() => f.raw.prepare("UPDATE live_diary_entries SET payload_encrypted = 'x' WHERE id = ?").run(first.id), /LIVE_DIARY_ENTRY_IMMUTABLE/);
    assert.throws(() => f.raw.prepare("UPDATE live_diary_entries SET status = 'active' WHERE id = ?").run(second.id), /LIVE_DIARY_STATUS_TRANSITION/);
    assert.throws(
      () => f.raw.prepare("INSERT INTO live_diary_entries (id, clinic_id, patient_id, author_user_id, diary_id, entry_date, reported_by, payload_encrypted, encryption_version) VALUES ('x', ?, 'paciente-beta', 'prof-a', 'diario-sono', '2026-11-01', 'family', 'c', 'v')").run(ALFA),
      /LIVE_DIARY_PATIENT_TENANT_MISMATCH/,
    );
  } finally {
    f.raw.close();
  }
});

test("diários LIVE: exportação LGPD da clínica inclui os registros decifrados, só da própria clínica", async () => {
  const f = await fixture();
  try {
    await f.call("prof-a", diaryPost as never, PATH, "POST", entry(), ALFA);
    await f.call("prof-b", diaryPost as never, PATH, "POST", entry({ clinicId: BETA, patientId: "paciente-beta", fields: { notes: "Relato fictício da beta" } }), BETA);
    await prepareExport(f, ALFA);
    const exported = await collectTenantExportPayload(f.env.DB as never, f.env as never, ALFA, { enforceSyncLimits: false });
    assert.equal(exported.ok, true, JSON.stringify(exported).slice(0, 300));
    const text = JSON.stringify((exported as { data: unknown }).data);
    assert.match(text, /Relato fictício de sono agitado/);
    assert.doesNotMatch(text, /Relato fictício da beta/);
  } finally {
    f.raw.close();
  }
});

test("diários LIVE: migration pendente responde 503 sem falso sucesso", async () => {
  const f = await fixture();
  try {
    f.raw.exec("DROP TABLE live_diary_entries");
    const res = await f.call("prof-a", diaryPost as never, PATH, "POST", entry(), ALFA);
    assert.equal(res.status, 503);
    assert.equal(((await res.json()) as { code: string }).code, "LIVE_DIARY_MIGRATION_PENDING");
    assert.equal((await f.call("prof-a", diaryGet as never, `${PATH}?clinicId=${ALFA}&patientId=paciente-alfa`, "GET", undefined, ALFA)).status, 503);
    await prepareExport(f, ALFA);
    const exported = await collectTenantExportPayload(f.env.DB as never, f.env as never, ALFA, { enforceSyncLimits: false });
    assert.equal(exported.ok, true, `export não quebra antes da migration: ${JSON.stringify(exported).slice(0, 300)}`);
  } finally {
    f.raw.close();
  }
});

test("diários LIVE: contrato puro e cobertura LGPD", () => {
  assert.equal(isValidDiaryDate("2024-02-29"), true);
  assert.equal(isValidDiaryDate("2023-02-29"), false);
  const ok = validateLiveDiaryEntry({ ...entry(), fields: { date: "2026-11-01", notes: "  x  ", vazio: "" } });
  assert.equal(ok.ok, true);
  if (ok.ok) assert.deepEqual(ok.value.fields, { notes: "x" }, "data vive em entryDate; vazios saem");
  const purge = readFileSync("functions/api/live/governance/_purge.ts", "utf8");
  assert.match(purge, /\{ table: "live_diary_entries", patientColumn: "patient_id" \}/, "eliminação do titular alcança os diários");
  assert.match(purge, /\{ table: "live_diary_entries", ts: "created_at" \}/, "piso legal de guarda cobre os diários");
  assert.match(purge, /OPTIONAL_PURGE_TABLES[^\n]*\["live_diary_entries"\]/, "tabela ausente não derruba a eliminação");
});

test("diários LIVE: cliente separa a data, descarta vazios e só mostra ativos", () => {
  const body = liveDiaryWriteBody({
    clinicId: ALFA, patientId: "paciente-alfa", diaryId: "diario-sono", reportedBy: "school",
    form: { date: "2026-11-02", quality: " 3 ", notes: "" }, fallbackDate: "2026-11-07",
  });
  assert.deepEqual(body, { clinicId: ALFA, patientId: "paciente-alfa", diaryId: "diario-sono", entryDate: "2026-11-02", reportedBy: "school", fields: { quality: "3" } });
  assert.equal(liveDiaryWriteBody({ clinicId: ALFA, patientId: "p", diaryId: "diario-sono", reportedBy: "family", form: { notes: "x" }, fallbackDate: "2026-11-07" }).entryDate, "2026-11-07");
  const view = liveDiaryEntriesFromResponse({ data: [
    { id: "a", patientId: "p", diaryId: "diario-sono", entryDate: "2026-11-01", reportedBy: "family", fields: { quality: "4" }, status: "active", createdAt: "2026-11-01T10:00:00Z" },
    { id: "b", patientId: "p", diaryId: "diario-sono", entryDate: "2026-11-01", reportedBy: "family", fields: {}, status: "voided", createdAt: "2026-11-01T10:00:00Z" },
  ] });
  assert.equal(view.length, 1);
  assert.equal(view[0].date, "2026-11-01");
  assert.equal(view[0].quality, "4");
  assert.deepEqual(liveDiaryEntriesFromResponse(null), []);
});
